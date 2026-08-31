import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { validateCategoryBallots, votingWindowStatus } from '../../src/domain/ballot-submission.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

const entry = { _id: votingTestIds.entryId, categoryId: votingTestIds.categoryId, title: 'Entry', status: 'active' }

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
  it('allows skipped categories but requires at least one participating category', () => {
    const secondCategoryId = new ObjectId()
    const event = votingEventFixture({ categories: [
      ...votingEventFixture().categories,
      { _id: secondCategoryId, title: 'Second', status: 'active' },
    ] })
    const entries = [entry, { ...entry, _id: new ObjectId(), categoryId: secondCategoryId, title: 'Other' }]
    const result = validateCategoryBallots({ event, entries, categoryBallots: [{
      categoryId: String(votingTestIds.categoryId), entryIds: [String(entry._id)],
    }] })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ categoryTitle: event.categories[0].title, categoryOrder: 0,
      entries: [{ entryTitle: entry.title, selectionOrder: 0 }] })
    expect(() => validateCategoryBallots({ event, entries, categoryBallots: [] }))
      .toThrow('Select at least one entry')
  })
})
