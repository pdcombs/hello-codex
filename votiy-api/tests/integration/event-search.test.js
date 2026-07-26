import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventSearchService } from '../../src/services/event-search-service.js'
import { createTestMongo } from '../support/mongo.js'
import { eventSearchFixture } from '../support/event-search-fixtures.js'

describe('event search with real MongoDB', () => {
  let mongo
  let repository
  let service
  beforeEach(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
    repository = createEventRepository(mongo.database)
    service = createEventSearchService({ eventRepository: repository, cursorSecret: 'test-secret' })
  })
  afterEach(async () => mongo?.cleanup())

  it('matches middle words and enforces visibility while minimizing private results', async () => {
    await mongo.database.collection('events').insertMany([
      eventSearchFixture({ publicId: 'public', title: 'Motorcycle Showcase' }),
      eventSearchFixture({ publicId: 'private', title: 'Private Motorcycle', visibility: 'private' }),
      eventSearchFixture({ publicId: 'unlisted', visibility: 'unlisted' }),
      eventSearchFixture({ publicId: 'archived', lifecycleStatus: 'archived', archivedAt: new Date() }),
    ])
    const result = await service.search({ query: 'torcy', first: 20 })
    expect(result.events.nodes.map(({ publicId }) => publicId).sort()).toEqual(['private', 'public'])
    expect(result.events.nodes.find(({ publicId }) => publicId === 'private').location).toBeNull()
  })
})
