import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCategory } from '../../src/domain/event-category.js'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventCategoryService } from '../../src/services/event-category-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('archive event category transaction', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  async function transaction(operation) {
    const session = mongo.client.startSession()
    try { let value; await session.withTransaction(async () => { value = await operation(session) }); return value }
    finally { await session.endSession() }
  }

  it('soft deletes category and entries, promotes default, audits, and replays idempotently', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const entries = createEventEntryRepository(mongo.database)
    const host = await accounts.createPending({ displayName: 'Host', emailNormalized: 'archive-host@example.test', passwordHash: 'hash' })
    const owner = await accounts.createPending({ displayName: 'Owner', emailNormalized: 'archive-owner@example.test', passwordHash: 'hash' })
    let event = await events.create({ schemaVersion: 2, ownerAccountId: host._id, publicId: randomUUID(), title: 'Archive' })
    const second = createCategory({ title: 'Second', now: new Date(event.createdAt.getTime() + 1) })
    event = await events.appendCategory(event._id, host._id, second)
    const created = await entries.createMany({ eventId: event._id, ownerAccountId: owner._id,
      createdByAccountId: host._id, entries: [{ categoryId: event.categories[0]._id, title: 'Entry' }], now: event.updatedAt })
    const service = createEventCategoryService({ eventRepository: events, eventEntryRepository: entries,
      accountRepository: accounts, idempotencyRepository: createIdempotencyRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database), withTransaction: transaction })
    const input = { eventId: String(event._id), categoryId: String(event.categories[0]._id),
      expectedEventUpdatedAt: event.updatedAt, expectedCategoryUpdatedAt: event.categories[0].updatedAt,
      activeEntries: [{ entryId: String(created[0]._id), expectedUpdatedAt: created[0].updatedAt }], idempotencyKey: randomUUID() }
    const first = await service.archiveCategory(input, { account: host }, { correlationId: randomUUID() })
    const replay = await service.archiveCategory(input, { account: host })
    expect(first.event.categories).toHaveLength(1)
    expect(first.event.categories[0]).toMatchObject({ id: String(second._id), isDefault: true })
    expect(replay.event.categories).toHaveLength(1)
    expect(await entries.findById(created[0]._id)).toMatchObject({ status: 'archived', archiveReason: 'category_removed' })
    const stored = await events.findById(event._id)
    expect(stored.categories.find(({ _id }) => String(_id) === input.categoryId)).toMatchObject({ status: 'archived' })
    expect(await mongo.database.collection('auditEvents').countDocuments({ name: 'event.category_archived' })).toBe(1)
  })
})
