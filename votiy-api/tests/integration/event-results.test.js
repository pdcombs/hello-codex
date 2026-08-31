import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createBallotSubmissionRepository } from '../../src/repositories/ballot-submission-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventResultsService } from '../../src/services/event-results-service.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

describe('event results with real MongoDB', () => {
  let mongo; let service; let event; const secondEntryId = new ObjectId()
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      defaultCategoryMethod: 'ranking' } })
    await mongo.database.collection('events').insertOne(event)
    const entry = (_id, title, offset) => ({ _id, eventId: event._id, categoryId: votingTestIds.categoryId,
      ownerAccountId: votingTestIds.voterId, title, createdByAccountId: votingTestIds.hostId, status: 'active',
      archiveReason: null, archivedAt: null, archivedByAccountId: null, createdAt: new Date(2030, 0, offset),
      updatedAt: new Date(2030, 0, offset), schemaVersion: 1 })
    await mongo.database.collection('eventEntries').insertMany([
      entry(votingTestIds.entryId, 'Alpha', 1), entry(secondEntryId, 'Beta', 2),
    ])
    const categoryBallots = [{ categoryId: votingTestIds.categoryId, categoryTitle: 'Category', categoryOrder: 0,
      method: 'ranking', entryIds: [votingTestIds.entryId, secondEntryId], entries: [
        { entryId: votingTestIds.entryId, entryTitle: 'Alpha', selectionOrder: 0 },
        { entryId: secondEntryId, entryTitle: 'Beta', selectionOrder: 1 },
      ] }]
    await mongo.database.collection('ballotSubmissions').insertOne({ _id: new ObjectId(), eventId: event._id,
      accountId: votingTestIds.voterId, accessCodeId: null, browserMarkerDigest: null, rulesVersion: 1,
      votingStateVersion: 1, accessPolicy: 'account', categoryBallots, submittedAt: new Date('2030-01-01T13:00:00Z'),
      createdAt: new Date('2030-01-01T13:00:00Z'), schemaVersion: 2 })
    service = createEventResultsService({ eventRepository: createEventRepository(mongo.database),
      eventEntryRepository: createEventEntryRepository(mongo.database),
      ballotRepository: createBallotSubmissionRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database), now: () => new Date('2030-01-01T14:00:00Z') })
  })
  afterAll(async () => mongo?.cleanup())

  it('returns exact host results and denies non-owner access without leaking totals', async () => {
    const result = await service.results({ publicId: event.publicId }, { account: { _id: votingTestIds.hostId } },
      { correlationId: 'results-host' })
    expect(result).toMatchObject({ votesReceived: 1, categories: [{ method: 'RANKING', contributingBallots: 1,
      entries: [{ entryTitle: 'Alpha', total: 1, winner: true }, { entryTitle: 'Beta', total: 0, winner: false }] }] })
    expect(await mongo.database.collection('auditEvents').countDocuments({ name: 'voting.results_viewed' })).toBe(1)
    await expect(service.results({ publicId: event.publicId }, { account: { _id: votingTestIds.voterId } }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
