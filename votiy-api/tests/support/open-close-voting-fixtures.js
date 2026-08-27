import { votingEventFixture, votingTestIds } from './event-voting-rules.js'

export const openVotingEvent = (overrides = {}) => votingEventFixture(overrides)
export const closedVotingEvent = (overrides = {}) => votingEventFixture({ votingState: {
  status: 'closed', version: 2, openedAt: new Date('2030-01-01T12:00:00Z'),
  closedAt: new Date('2030-01-01T12:30:00Z'), updatedAt: new Date('2030-01-01T12:30:00Z'),
  updatedByAccountId: votingTestIds.hostId,
}, ...overrides })
