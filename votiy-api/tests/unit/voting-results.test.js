import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { calculateVotingResults } from '../../src/domain/voting-results.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

const categoryId = votingTestIds.categoryId
const entryIds = Array.from({ length: 5 }, () => new ObjectId())
const entries = entryIds.map((_id, index) => ({ _id, eventId: votingTestIds.eventId, categoryId,
  title: `Entry ${index + 1}`, status: 'active', createdAt: new Date(2030, 0, index + 1) }))
const categoryBallot = (method, selected, title = 'Category') => ({ categoryId, categoryTitle: title,
  categoryOrder: 0, method, entries: selected.map((index, selectionOrder) => ({ entryId: entryIds[index],
    entryTitle: `Entry ${index + 1}`, selectionOrder })) })
const ballot = (...categoryBallots) => ({ _id: new ObjectId(), categoryBallots })

describe('voting result calculation', () => {
  it('counts single and multiple choices, keeps zero entries, and highlights co-winners', () => {
    const event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      defaultCategoryMethod: 'multiple', defaultMultipleMin: 1, defaultMultipleMax: 3 } })
    const result = calculateVotingResults({ event, entries, ballots: [
      ballot(categoryBallot('multiple', [0, 1])), ballot(categoryBallot('multiple', [1, 0])),
      ballot(categoryBallot('multiple', [2])),
    ] })
    expect(result.votesReceived).toBe(3)
    expect(result.categories[0].entries.map(({ entryTitle, total, winner }) => [entryTitle, total, winner])).toEqual([
      ['Entry 1', 2, true], ['Entry 2', 2, true], ['Entry 3', 1, false],
      ['Entry 4', 0, false], ['Entry 5', 0, false],
    ])
  })

  it('awards N-P rank points and aggregates multiple ballots', () => {
    const event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      defaultCategoryMethod: 'ranking' } })
    const result = calculateVotingResults({ event, entries, ballots: [
      ballot(categoryBallot('ranking', [0, 1, 2, 3, 4])),
      ballot(categoryBallot('ranking', [1, 0, 2, 4, 3])),
    ] })
    expect(result.categories[0].entries.map(({ entryTitle, total, winner }) => [entryTitle, total, winner])).toEqual([
      ['Entry 1', 7, true], ['Entry 2', 7, true], ['Entry 3', 4, false],
      ['Entry 4', 1, false], ['Entry 5', 1, false],
    ])
  })

  it('shows no winner without contributions and handles sole ranked entry at zero', () => {
    const rankingEvent = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules,
      defaultCategoryMethod: 'ranking' } })
    expect(calculateVotingResults({ event: rankingEvent, entries: entries.slice(0, 1), ballots: [] })
      .categories[0].entries[0]).toMatchObject({ total: 0, winner: false })
    expect(calculateVotingResults({ event: rankingEvent, entries: entries.slice(0, 1),
      ballots: [ballot(categoryBallot('ranking', [0]))] }).categories[0].entries[0])
      .toMatchObject({ total: 0, winner: true })
  })

  it('retains historical category and entry snapshots absent from current event', () => {
    const archivedCategoryId = new ObjectId(); const archivedEntryId = new ObjectId()
    const result = calculateVotingResults({ event: votingEventFixture(), entries, ballots: [ballot({
      categoryId: archivedCategoryId, categoryTitle: 'Archived category', categoryOrder: 1, method: 'single',
      entries: [{ entryId: archivedEntryId, entryTitle: 'Archived winner', selectionOrder: 0 }],
    })] })
    expect(result.categories[1]).toMatchObject({ categoryTitle: 'Archived category', method: 'SINGLE',
      entries: [{ entryTitle: 'Archived winner', total: 1, winner: true }] })
  })
})
