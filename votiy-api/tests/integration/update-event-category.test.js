import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventCategoryService } from '../../src/services/event-category-service.js'
import { createTestMongo } from '../support/mongo.js'
import { categorySnapshot } from '../support/edit-entry-titles.js'

describe('update event category with real MongoDB', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  async function withTransaction(operation) {
    const session = mongo.client.startSession()
    try {
      let result
      await session.withTransaction(async () => { result = await operation(session) })
      return result
    } finally {
      await session.endSession()
    }
  }

  it('atomically changes category and selected entry titles with audit history', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const entries = createEventEntryRepository(mongo.database)
    const owner = await accounts.createPending({ displayName: 'Owner', emailNormalized: 'edit-owner@example.test', passwordHash: 'hash' })
    const participant = await accounts.createPending({ displayName: 'Participant', emailNormalized: 'edit-participant@example.test', passwordHash: 'hash' })
    const event = await events.create({ schemaVersion: 2, ownerAccountId: owner._id, publicId: randomUUID(), title: 'Contest' })
    const created = await entries.createMany({ eventId: event._id, ownerAccountId: participant._id,
      createdByAccountId: owner._id, entries: [
        { categoryId: event.categories[0]._id, title: 'First' },
        { categoryId: event.categories[0]._id, title: 'Second' },
      ], now: event.createdAt })
    const service = createEventCategoryService({ eventRepository: events, eventEntryRepository: entries,
      accountRepository: accounts, idempotencyRepository: createIdempotencyRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database), withTransaction })
    const snapshot = categorySnapshot(event.categories[0], created)
    const result = await service.updateCategory({ ...snapshot, eventId: String(event._id), title: 'Finalists',
      entryTitles: snapshot.entryTitles.map((entry, index) => ({ ...entry, title: index ? entry.title : 'Winner' })),
      idempotencyKey: randomUUID() }, { account: owner }, { correlationId: randomUUID() })
    expect(result.event.categories[0].title).toBe('Finalists')
    expect(result.event.categories[0].entries.map(({ title }) => title)).toEqual(['Winner', 'Second'])
    const audit = await mongo.database.collection('auditEvents').find({ name: 'entry.title_changed' }).toArray()
    expect(audit).toHaveLength(1)
    expect(audit[0].metadata).not.toHaveProperty('title')
  })

  it('rejects a concurrent archive and rolls back a transaction when audit persistence fails', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const entries = createEventEntryRepository(mongo.database)
    const owner = await accounts.createPending({ displayName: 'Race Owner', emailNormalized: 'race-owner@example.test', passwordHash: 'hash' })
    const participant = await accounts.createPending({ displayName: 'Race Participant', emailNormalized: 'race-participant@example.test', passwordHash: 'hash' })
    const event = await events.create({ schemaVersion: 2, ownerAccountId: owner._id, publicId: randomUUID(), title: 'Race Contest' })
    const created = await entries.createMany({ eventId: event._id, ownerAccountId: participant._id,
      createdByAccountId: owner._id, entries: [{ categoryId: event.categories[0]._id, title: 'Original' }],
      now: event.createdAt })
    const snapshot = categorySnapshot(event.categories[0], created)
    const baseInput = { ...snapshot, eventId: String(event._id),
      entryTitles: [{ ...snapshot.entryTitles[0], title: 'Changed' }], idempotencyKey: randomUUID() }
    const idempotency = createIdempotencyRepository(mongo.database)
    const service = createEventCategoryService({ eventRepository: events, eventEntryRepository: entries,
      accountRepository: accounts, idempotencyRepository: idempotency,
      auditRepository: createAuditEventRepository(mongo.database), withTransaction })
    await entries.archiveOne({ eventId: event._id, entryId: created[0]._id, archivedByAccountId: owner._id,
      now: new Date(event.createdAt.getTime() + 1_000) })
    await expect(service.updateCategory(baseInput, { account: owner })).rejects.toMatchObject({ code: 'CONFLICT' })

    const active = await entries.createMany({ eventId: event._id, ownerAccountId: participant._id,
      createdByAccountId: owner._id, entries: [{ categoryId: event.categories[0]._id, title: 'Rollback original' }],
      now: new Date(event.createdAt.getTime() + 2_000) })
    const currentEvent = await events.findById(event._id)
    const rollbackSnapshot = categorySnapshot(currentEvent.categories[0], active)
    const failing = createEventCategoryService({ eventRepository: events, eventEntryRepository: entries,
      accountRepository: accounts, idempotencyRepository: idempotency, withTransaction,
      auditRepository: { append: async () => { throw new Error('AUDIT_FAILED') } } })
    await expect(failing.updateCategory({ ...rollbackSnapshot, eventId: String(event._id),
      entryTitles: [{ ...rollbackSnapshot.entryTitles[0], title: 'Must roll back' }],
      idempotencyKey: randomUUID() }, { account: owner })).rejects.toThrow('AUDIT_FAILED')
    expect((await entries.findById(active[0]._id)).title).toBe('Rollback original')
  })
})
