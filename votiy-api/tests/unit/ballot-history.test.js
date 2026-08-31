import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { ballotHistoryPageSize, decodeBallotHistoryCursor, encodeBallotHistoryCursor } from '../../src/domain/ballot-history.js'

describe('ballot history cursor', () => {
  it('round trips timestamp and identity', () => {
    const ballot = { _id: new ObjectId(), submittedAt: new Date('2030-01-01T00:00:00Z') }
    expect(decodeBallotHistoryCursor(encodeBallotHistoryCursor(ballot))).toEqual({
      id: ballot._id, submittedAt: ballot.submittedAt,
    })
  })
  it('rejects malformed cursors and out-of-range page sizes', () => {
    expect(() => decodeBallotHistoryCursor('invalid')).toThrow('Invalid ballot history cursor')
    expect(() => ballotHistoryPageSize(0)).toThrow(); expect(() => ballotHistoryPageSize(101)).toThrow()
    expect(ballotHistoryPageSize()).toBe(20)
  })
})
