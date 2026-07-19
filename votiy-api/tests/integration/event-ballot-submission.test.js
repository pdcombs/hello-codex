import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createBallotSubmissionRepository } from '../../src/repositories/ballot-submission-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventVotingService } from '../../src/services/event-voting-service.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

describe('event ballot submission with real MongoDB', () => {
  let mongo; let service
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    const event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      opensAt: new Date('2029-12-31T00:00:00Z'), closesAt: new Date('2030-01-02T00:00:00Z') } })
    await mongo.database.collection('events').insertOne(event)
    await mongo.database.collection('eventEntries').insertOne({ _id: votingTestIds.entryId, eventId: event._id,
      categoryId: votingTestIds.categoryId, ownerAccountId: votingTestIds.voterId, title: 'Entry',
      createdByAccountId: votingTestIds.hostId, status: 'active', archiveReason: null, archivedAt: null,
      archivedByAccountId: null, createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    service = createEventVotingService({ eventRepository: createEventRepository(mongo.database),
      eventEntryRepository: createEventEntryRepository(mongo.database),
      ballotRepository: createBallotSubmissionRepository(mongo.database),
      idempotencyRepository: createIdempotencyRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database), withTransaction: async (operation) => {
        const session = mongo.client.startSession(); let value
        try { await session.withTransaction(async () => { value = await operation(session) }); return value }
        finally { await session.endSession() }
      },
      now: () => new Date('2030-01-01T13:00:00Z') })
  })
  afterAll(async () => mongo?.cleanup())

  it('atomically saves an immutable rule-valid ballot and idempotent replay', async () => {
    const input = { eventId: String(votingTestIds.eventId), expectedRulesVersion: 1,
      categoryBallots: [{ categoryId: String(votingTestIds.categoryId), entryIds: [String(votingTestIds.entryId)] }],
      idempotencyKey: 'ballot-1' }
    const first = await service.submit(input, null, { correlationId: 'ballot-1' })
    const replay = await service.submit(input, null, { correlationId: 'ballot-1' })
    expect(replay.receipt.id).toBe(first.receipt.id)
    expect(await mongo.database.collection('ballotSubmissions').countDocuments()).toBe(1)
  })
})
