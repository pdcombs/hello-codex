import { ObjectId } from 'mongodb'

export function createClosedVotingState({ ownerAccountId, now = new Date() }) {
  return Object.freeze({ status: 'closed', version: 1, openedAt: null, closedAt: now,
    updatedAt: now, updatedByAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId) })
}

export function transitionVotingState(current, requestedStatus, { ownerAccountId, now = new Date() }) {
  const status = requestedStatus.toLowerCase()
  if (!['open', 'closed'].includes(status)) throw new TypeError('Voting status is invalid')
  if (current.status === status) throw new Error('VOTING_STATE_UNCHANGED')
  return Object.freeze({ status, version: current.version + 1,
    openedAt: status === 'open' ? now : current.openedAt,
    closedAt: status === 'closed' ? now : current.closedAt,
    updatedAt: now, updatedByAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId) })
}

export function toVotingStateView(state) {
  return { status: state.status.toUpperCase(), version: state.version, openedAt: state.openedAt,
    closedAt: state.closedAt, updatedAt: state.updatedAt }
}
