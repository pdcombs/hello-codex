import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventCategoryService } from '../../src/services/event-category-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('event categories with real MongoDB', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('creates and renames uniquely under concurrency and denies non-owner', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const owner = await accounts.createPending({ displayName: 'Owner', emailNormalized: 'category-owner@example.test', passwordHash: 'hash' })
    const other = await accounts.createPending({ displayName: 'Other', emailNormalized: 'category-other@example.test', passwordHash: 'hash' })
    const event = await events.create({ schemaVersion: 2, ownerAccountId: owner._id, publicId: 'category-concurrency', title: "Peyton's event" })
    expect(event.categories[0].title).toBe("Peyton's event participants")
    const service = createEventCategoryService({ eventRepository: events, idempotencyRepository: createIdempotencyRepository(mongo.database) })
    const viewer = { account: owner }
    const concurrent = await Promise.allSettled([
      service.addCategory({ eventId: String(event._id), title: 'Desserts', idempotencyKey: randomUUID() }, viewer),
      service.addCategory({ eventId: String(event._id), title: '  DESSERTS ', idempotencyKey: randomUUID() }, viewer),
    ])
    expect(concurrent.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(concurrent.filter(({ status }) => status === 'rejected')[0].reason).toMatchObject({ code: 'CONFLICT' })
    const saved = await events.findById(event._id)
    const desserts = saved.categories.find(({ titleNormalized }) => titleNormalized === 'desserts')
    const renamed = await service.renameCategory({ eventId: String(event._id), categoryId: String(desserts._id),
      title: 'Cakes', idempotencyKey: randomUUID() }, viewer)
    expect(renamed.event.categories.some(({ title }) => title === 'Cakes')).toBe(true)
    await expect(service.addCategory({ eventId: String(event._id), title: 'Denied', idempotencyKey: randomUUID() },
      { account: other })).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
