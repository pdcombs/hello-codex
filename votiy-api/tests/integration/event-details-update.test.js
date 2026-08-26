import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventService } from '../../src/services/event-service.js'
import { eventDetailsVotingFixture } from '../support/event-details-voting-fixtures.js'
import { createTestMongo } from '../support/mongo.js'

describe('event details update with real MongoDB', () => {
  let mongo; let event; let service
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = eventDetailsVotingFixture(); await mongo.database.collection('events').insertOne(event)
    service = createEventService({ eventRepository: createEventRepository(mongo.database), idempotencyRepository: {},
      now: () => new Date('2030-01-02T00:00:00Z'), logger: { info() {} } })
  })
  afterAll(async () => mongo?.cleanup())

  it('atomically persists details/search, keeps stable IDs, and rejects the losing save', async () => {
    const input = { eventId: String(event._id), title: 'New Community Awards', description: null,
      location: 'West Hall', expectedUpdatedAt: event.updatedAt }
    const [first, second] = await Promise.allSettled([
      service.updateDetails(input, { account: { _id: event.ownerAccountId } }),
      service.updateDetails(input, { account: { _id: event.ownerAccountId } }),
    ])
    expect([first.status, second.status].sort()).toEqual(['fulfilled', 'rejected'])
    const stored = await mongo.database.collection('events').findOne({ _id: event._id })
    expect(stored).toMatchObject({ publicId: event.publicId, title: 'New Community Awards', description: null,
      location: 'West Hall', searchTitleNormalized: 'new community awards', searchDescriptionNormalized: '',
      searchLocationNormalized: 'west hall' })
  })
})
