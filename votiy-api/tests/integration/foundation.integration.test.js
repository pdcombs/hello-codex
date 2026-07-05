import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('real Mongo foundation', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo() })
  afterAll(async () => { await mongo?.cleanup() })

  it('creates validated collections and indexes', async () => {
    await ensureCollectionsAndIndexes(mongo.database)
    const collections = await mongo.database.listCollections({}, { nameOnly: true }).toArray()
    expect(collections.map(({ name }) => name)).toContain('accounts')
    const indexes = await mongo.database.collection('accounts').indexes()
    expect(indexes.map(({ name }) => name)).toContain('account_email_unique')
  })
})
