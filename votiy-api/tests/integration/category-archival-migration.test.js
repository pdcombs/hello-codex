import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runCategoryArchivalMigration } from '../../src/migrations/004-category-archival.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('category archival migration', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('fills legacy and partial lifecycle fields and is idempotent', async () => {
    const now = new Date('2026-07-19T12:00:00.000Z')
    const event = { _id: new ObjectId(), ownerAccountId: new ObjectId(), publicId: 'legacy-category', title: 'Legacy',
      description: null, location: null, registrationPolicy: 'admin_managed', categories: [
        { _id: new ObjectId(), title: 'Legacy', titleNormalized: 'legacy', isDefault: true,
          createdAt: now, updatedAt: now },
        { _id: new ObjectId(), title: 'Partial', titleNormalized: 'partial', isDefault: false,
          status: 'active', createdAt: now, updatedAt: now },
      ], createdAt: now, updatedAt: now, schemaVersion: 2 }
    await mongo.database.collection('events').insertOne(event, { bypassDocumentValidation: true })
    expect(await runCategoryArchivalMigration({ database: mongo.database })).toEqual({ migrated: 1 })
    expect(await runCategoryArchivalMigration({ database: mongo.database })).toEqual({ migrated: 0 })
    const saved = await mongo.database.collection('events').findOne({ _id: event._id })
    expect(saved.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'active', archiveReason: null, archivedAt: null, archivedByAccountId: null }),
    ]))
  })
})
