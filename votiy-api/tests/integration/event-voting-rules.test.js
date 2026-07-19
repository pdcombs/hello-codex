import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventVotingRulesService } from '../../src/services/event-voting-rules-service.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

describe('host voting rules with real MongoDB', () => {
  let mongo; let service; let event
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = votingEventFixture(); await mongo.database.collection('events').insertOne(event)
    service = createEventVotingRulesService({ eventRepository: createEventRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database), now: () => new Date('2030-01-01T11:00:00Z') })
  })
  afterAll(async () => mongo?.cleanup())

  it('saves once, rejects stale writes, and denies non-hosts', async () => {
    const input = { eventId: String(event._id), expectedEventUpdatedAt: event.updatedAt,
      expectedRulesVersion: 1, opensAt: '2030-01-01T12:00:00Z', closesAt: '2030-01-01T14:00:00Z',
      accessPolicy: 'UNRESTRICTED', unrestrictedRepeatPolicy: 'UNLIMITED', maximumBallotsPerAccount: null,
      codeRequiresCompletedAccount: null, defaultCategoryRule: { categoryId: null, method: 'SINGLE',
        minimumSelections: null, maximumSelections: null }, categoryRules: [] }
    const saved = await service.updateRules(input, { account: { _id: votingTestIds.hostId } }, { correlationId: 'rules-1' })
    expect(saved.event.voting.rules.version).toBe(2)
    await expect(service.updateRules(input, { account: { _id: votingTestIds.hostId } })).rejects.toMatchObject({ code: 'CONFLICT' })
    await expect(service.updateRules({ ...input, expectedEventUpdatedAt: saved.event.updatedAt, expectedRulesVersion: 2 },
      { account: { _id: votingTestIds.voterId } })).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
