import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createBallotSubmissionRepository } from '../../src/repositories/ballot-submission-repository.js'
import { createEventVoterAccessRepository } from '../../src/repositories/event-voter-access-repository.js'
import { createVotingAccessCodeRepository } from '../../src/repositories/voting-access-code-repository.js'

describe('event voting repository contracts', () => {
  it('uses conditional unused status for atomic code consumption', async () => {
    const findOneAndUpdate = vi.fn().mockResolvedValue(null)
    const repository = createVotingAccessCodeRepository({ collection: () => ({ findOneAndUpdate }) })
    const ballotId = new ObjectId()
    await repository.consume({ codeId: new ObjectId(), accountId: new ObjectId(), ballotId, now: new Date() })
    expect(findOneAndUpdate.mock.calls[0][0]).toMatchObject({ status: 'unused' })
    expect(findOneAndUpdate.mock.calls[0][1]).toMatchObject({ $set: { usedByBallotId: ballotId } })
  })

  it('refuses code consumption without an accepted ballot identity', () => {
    const repository = createVotingAccessCodeRepository({ collection: () => ({}) })
    expect(() => repository.consume({ codeId: new ObjectId(), now: new Date() })).toThrow('ballotId is required')
  })

  it('upserts one event/account access relationship', async () => {
    const findOneAndUpdate = vi.fn().mockResolvedValue({ status: 'active' })
    const repository = createEventVoterAccessRepository({ collection: () => ({ findOneAndUpdate }) })
    const eventId = new ObjectId(); const accountId = new ObjectId()
    await repository.grant({ eventId, accountId, source: 'account_policy', now: new Date() })
    expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ eventId, accountId })
    expect(findOneAndUpdate.mock.calls[0][2]).toMatchObject({ upsert: true, returnDocument: 'after' })
  })

  it('inserts immutable ballot documents without update operations', async () => {
    const insertOne = vi.fn()
    const repository = createBallotSubmissionRepository({ collection: () => ({ insertOne }) })
    const ballot = { _id: new ObjectId() }
    expect(await repository.create(ballot)).toBe(ballot)
    expect(insertOne).toHaveBeenCalledWith(ballot, {})
  })
})
