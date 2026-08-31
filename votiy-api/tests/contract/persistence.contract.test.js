import { describe, expect, it, vi } from 'vitest'
import { collectionDefinitions, ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'

describe('Mongo persistence contract', () => {
  it('applies strict validators and every declared index', async () => {
    const createIndexes = vi.fn()
    const database = {
      listCollections: () => ({ toArray: async () => [] }),
      createCollection: vi.fn(),
      collection: () => ({ createIndexes, listIndexes: () => ({ toArray: async () => [] }), dropIndex: vi.fn() }),
    }
    await ensureCollectionsAndIndexes(database)
    expect(database.createCollection).toHaveBeenCalledTimes(Object.keys(collectionDefinitions).length)
    expect(createIndexes).toHaveBeenCalledTimes(Object.keys(collectionDefinitions).length)
    for (const call of database.createCollection.mock.calls) {
      expect(call[1]).toMatchObject({ validationLevel: 'strict', validationAction: 'error' })
    }
  })
})
