import { describe, expect, it } from 'vitest'
import { createClosedVotingState, transitionVotingState, toVotingStateView } from '../../src/domain/event-voting-state.js'
import { votingTestIds } from '../support/event-voting-rules.js'

describe('manual voting state', () => {
  it('starts closed and changes only status/version timestamps', () => {
    const start = new Date('2030-01-01T00:00:00Z')
    const closed = createClosedVotingState({ ownerAccountId: votingTestIds.hostId, now: start })
    expect(toVotingStateView(closed)).toMatchObject({ status: 'CLOSED', version: 1, openedAt: null })
    const opened = transitionVotingState(closed, 'OPEN', { ownerAccountId: votingTestIds.hostId,
      now: new Date('2030-01-01T01:00:00Z') })
    expect(opened).toMatchObject({ status: 'open', version: 2, closedAt: start })
    const reclosed = transitionVotingState(opened, 'CLOSED', { ownerAccountId: votingTestIds.hostId,
      now: new Date('2030-01-01T02:00:00Z') })
    expect(reclosed).toMatchObject({ status: 'closed', version: 3, openedAt: opened.openedAt })
  })
  it('rejects same and invalid transitions', () => {
    const state = createClosedVotingState({ ownerAccountId: votingTestIds.hostId })
    expect(() => transitionVotingState(state, 'CLOSED', { ownerAccountId: votingTestIds.hostId })).toThrow('VOTING_STATE_UNCHANGED')
    expect(() => transitionVotingState(state, 'PAUSED', { ownerAccountId: votingTestIds.hostId })).toThrow('invalid')
  })
})
