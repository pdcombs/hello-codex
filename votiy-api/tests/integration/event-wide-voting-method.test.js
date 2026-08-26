import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { configureVotingRules, effectiveCategoryRule } from '../../src/domain/event-voting-rules.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { eventDetailsVotingFixture } from '../support/event-details-voting-fixtures.js'
import { createTestMongo } from '../support/mongo.js'

describe('event-wide method persistence with real MongoDB', () => {
  let mongo; let event
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = eventDetailsVotingFixture(); await mongo.database.collection('events').insertOne(event)
  })
  afterAll(async () => mongo?.cleanup())

  it('preserves dormant overrides while every category resolves the new default', async () => {
    const dormant = event.votingRules.categoryOverrides.map((rule) => ({ ...rule }))
    const updated = configureVotingRules(event.votingRules, { expectedRulesVersion: event.votingRules.version,
      opensAt: '2030-01-02T01:00:00Z', closesAt: '2030-01-02T03:00:00Z',
      accessPolicy: 'UNRESTRICTED', unrestrictedRepeatPolicy: 'UNLIMITED', maximumBallotsPerAccount: null,
      codeRequiresCompletedAccount: null, defaultCategoryRule: { method: 'single', minimumSelections: null,
        maximumSelections: null }, categoryRules: [{ categoryId: String(dormant[0].categoryId), method: 'ranking' }] },
    { ownerAccountId: event.ownerAccountId, categoryIds: event.categories.map(({ _id }) => _id),
      now: new Date('2030-01-02T00:00:00Z') })
    const saved = await createEventRepository(mongo.database).updateVotingRules(event._id, event.ownerAccountId,
      event.updatedAt, event.votingRules.version, updated)
    expect(saved.votingRules.categoryOverrides).toEqual(dormant)
    expect(effectiveCategoryRule(saved.votingRules, dormant[0].categoryId).method).toBe('single')
  })
})
