import { ObjectId } from 'mongodb'
import { withEventVersion4 } from '../../src/domain/event.js'
import { votingEventFixture } from './event-voting-rules.js'

export function eventDetailsVotingFixture(overrides = {}) {
  const base = votingEventFixture()
  const details = { title: 'Community Awards', description: 'Annual awards', location: 'Main Hall' }
  return withEventVersion4({ ...base, ...details,
    votingRules: { ...base.votingRules, categoryOverrides: [{ categoryId: new ObjectId(), method: 'ranking',
      minimumSelections: null, maximumSelections: null }] }, ...overrides })
}

export const feature011Viewers = Object.freeze({
  anonymous: null,
  host: (event) => ({ account: { _id: event.ownerAccountId } }),
  nonHost: () => ({ account: { _id: new ObjectId() } }),
})
