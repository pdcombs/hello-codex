import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runEventSearchMigration } from '../../src/migrations/006-event-search.js'
import { createEventDocument, withEventVersion3 } from '../../src/domain/event.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('event search migration', () => {
  let mongo
  beforeAll(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
  })
  afterAll(async () => mongo?.cleanup())

  it('upgrades version three idempotently with public-active defaults and index', async () => {
    const event = withEventVersion3(createEventDocument({
      ownerAccountId: new ObjectId(), publicId: 'legacy-search',
      title: 'Café Motorcycle Show', description: 'Competition', location: 'Rogers AR',
      now: new Date(),
    }))
    await mongo.database.collection('events').insertOne(event)
    expect(await runEventSearchMigration({ database: mongo.database })).toEqual({ migrated: 1 })
    expect(await runEventSearchMigration({ database: mongo.database })).toEqual({ migrated: 0 })
    const migrated = await mongo.database.collection('events').findOne({ _id: event._id })
    expect(migrated).toMatchObject({ schemaVersion: 4, visibility: 'public', lifecycleStatus: 'active' })
    expect(migrated.searchTitleNormalized).toBe('cafe motorcycle show')
    expect((await mongo.database.collection('events').indexes()).map(({ name }) => name))
      .toContain('event_search_eligibility_grams')
  })
})
