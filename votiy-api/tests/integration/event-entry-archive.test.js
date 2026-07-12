import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventEntryService } from '../../src/services/event-entry-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('event entry creation and archive', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('creates standalone entries and archives one or all without registration writes', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const entries = createEventEntryRepository(mongo.database)
    const idempotency = createIdempotencyRepository(mongo.database)
    const host = await accounts.createPending({ displayName: 'Host', emailNormalized: 'host-003@example.test', passwordHash: 'hash' })
    const event = await events.create({ schemaVersion: 2, ownerAccountId: host._id, publicId: 'entry-archive', title: 'Archive' })
    const withTransaction = async (operation) => { const session = mongo.client.startSession(); try {
      let value; await session.withTransaction(async () => { value = await operation(session) }); return value
    } finally { await session.endSession() } }
    const service = createEventEntryService({ eventRepository: events, eventEntryRepository: entries,
      accountRepository: accounts, idempotencyRepository: idempotency, withTransaction })
    const viewer = { account: { ...host, verificationStatus: 'verified' } }
    const created = await service.addParticipant({ eventId: String(event._id), displayName: 'Peyton',
      email: 'peyton-003@example.test', entries: [
        { title: 'Pie', categoryId: String(event.categories[0]._id) },
        { title: 'Cake', categoryId: String(event.categories[0]._id) },
      ], idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }, viewer)
    expect(created.affectedParticipant.entryCount).toBe(2)
    expect(await mongo.database.collection('eventRegistrations').countDocuments()).toBe(0)

    const one = await service.archiveEntry({ eventId: String(event._id), entryId: created.createdEntries[0].id,
      idempotencyKey: '223e4567-e89b-42d3-a456-426614174000' }, viewer)
    expect(one.affectedParticipant.entryCount).toBe(1)
    const all = await service.archiveParticipantEntries({ eventId: String(event._id),
      accountId: created.affectedParticipant.accountId,
      idempotencyKey: '323e4567-e89b-42d3-a456-426614174000' }, viewer)
    expect(all.archivedEntryIds).toHaveLength(1)
    expect(await mongo.database.collection('eventEntries').countDocuments({ status: 'active' })).toBe(0)
    expect(await mongo.database.collection('eventEntries').countDocuments({ status: 'archived' })).toBe(2)
  })
})
