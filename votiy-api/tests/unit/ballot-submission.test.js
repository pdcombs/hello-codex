import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { validateCategoryBallots, votingWindowStatus } from '../../src/domain/ballot-submission.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

const entry = { _id: votingTestIds.entryId, categoryId: votingTestIds.categoryId, status: 'active' }

describe('ballot submission rules', () => {
  it('uses inclusive opening and exclusive closing', () => {
    const rules = votingEventFixture().votingRules
    expect(votingWindowStatus(rules, rules.opensAt)).toBe('OPEN')
    expect(votingWindowStatus(rules, rules.closesAt)).toBe('CLOSED')
  })
  it('accepts exactly one active entry for single selection', () => {
    expect(validateCategoryBallots({ event: votingEventFixture(), entries: [entry], categoryBallots: [{
      categoryId: String(votingTestIds.categoryId), entryIds: [String(votingTestIds.entryId)] }] })).toHaveLength(1)
  })
  it('rejects stale entries, duplicates, and incomplete ranking', () => {
    expect(() => validateCategoryBallots({ event: votingEventFixture(), entries: [entry], categoryBallots: [{
      categoryId: String(votingTestIds.categoryId), entryIds: [String(new ObjectId())] }] })).toThrow('invalid entries')
    const rankedEvent = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      defaultCategoryMethod: 'ranking' } })
    expect(() => validateCategoryBallots({ event: rankedEvent, entries: [entry, { ...entry, _id: new ObjectId() }],
      categoryBallots: [{ categoryId: String(votingTestIds.categoryId), entryIds: [String(entry._id)] }] }))
      .toThrow('Rank every entry')
  })
})
