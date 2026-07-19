import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runEventVotingRulesMigration } from '../../src/migrations/005-event-voting-rules.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('event voting rules migration', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('adds closed draft rules and is idempotent', async () => {
    const now = new Date('2026-07-19T12:00:00.000Z')
    const ownerAccountId = new ObjectId()
    const event = { _id: new ObjectId(), ownerAccountId, publicId: 'legacy-voting', title: 'Legacy',
      description: null, location: null, registrationPolicy: 'admin_managed', categories: [{
        _id: new ObjectId(), title: 'Legacy participants', titleNormalized: 'legacy participants',
        isDefault: true, status: 'active', archiveReason: null, archivedAt: null,
        archivedByAccountId: null, createdAt: now, updatedAt: now,
      }],
      createdAt: now, updatedAt: now, schemaVersion: 2 }
    await mongo.database.collection('events').insertOne(event, { bypassDocumentValidation: true })
    expect(await runEventVotingRulesMigration({ database: mongo.database })).toEqual({ migrated: 1 })
    expect(await runEventVotingRulesMigration({ database: mongo.database })).toEqual({ migrated: 0 })
    const saved = await mongo.database.collection('events').findOne({ _id: event._id })
    expect(saved).toMatchObject({ schemaVersion: 3, votingRules: {
      status: 'draft', opensAt: null, closesAt: null, updatedByAccountId: ownerAccountId,
    } })
  })
})
