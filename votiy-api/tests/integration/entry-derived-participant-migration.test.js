import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runEventSetupMigration } from '../../src/migrations/002-event-categories-entries.js'
import { runEntryDerivedParticipantMigration, SYSTEM_MIGRATION_ACTOR_ID } from '../../src/migrations/003-entry-derived-participants.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('entry-derived participant migration', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('preserves entry identity and maps active/removed history idempotently', async () => {
    const now = new Date('2026-07-12T12:00:00.000Z')
    const hostId = new ObjectId(); const participantId = new ObjectId(); const removedId = new ObjectId()
    const eventId = new ObjectId(); const categoryId = new ObjectId(); const activeEntryId = new ObjectId(); const archivedEntryId = new ObjectId()
    const accountBase = { displayName: 'Person', emailNormalized: null, phoneNormalized: null,
      referredByAccountId: null, lifecycleStatus: 'completed', passwordHash: 'hash', verificationStatus: 'verified',
      verifiedAt: now, credentialVersion: 1, createdAt: now, updatedAt: now, schemaVersion: 2 }
    await mongo.database.collection('accounts').insertMany([
      { ...accountBase, _id: hostId, emailNormalized: 'host@example.test' },
      { ...accountBase, _id: participantId, emailNormalized: 'active@example.test' },
      { ...accountBase, _id: removedId, emailNormalized: 'removed@example.test' },
    ])
    await mongo.database.collection('events').insertOne({ _id: eventId, ownerAccountId: hostId, publicId: 'migration-003',
      title: 'Migration', description: null, location: null, registrationPolicy: 'admin_managed',
      categories: [{ _id: categoryId, title: 'People', titleNormalized: 'people', isDefault: true,
        status: 'active', archiveReason: null, archivedAt: null, archivedByAccountId: null,
        createdAt: now, updatedAt: now }], createdAt: now, updatedAt: now, schemaVersion: 2 })
    const embedded = (id, title) => ({ _id: id, categoryId, title, createdByAccountId: hostId, createdAt: now, schemaVersion: 1 })
    await mongo.database.collection('eventRegistrations').insertMany([
      { _id: new ObjectId(), eventId, accountId: participantId, status: 'registered', registrationSource: 'host',
        registeredByAccountId: hostId, removedAt: null, entries: [embedded(activeEntryId, 'Active')],
        createdAt: now, updatedAt: now, schemaVersion: 2 },
      { _id: new ObjectId(), eventId, accountId: removedId, status: 'removed', registrationSource: 'host',
        registeredByAccountId: hostId, removedAt: now, entries: [embedded(archivedEntryId, 'Archived')],
        createdAt: now, updatedAt: now, schemaVersion: 2 },
    ])

    const first = await runEntryDerivedParticipantMigration({ database: mongo.database, now })
    const second = await runEntryDerivedParticipantMigration({ database: mongo.database, now })
    expect(first).toMatchObject({ processed: 2, inserted: 2, active: 1, archived: 1, invalid: 0 })
    expect(second).toMatchObject({ processed: 2, inserted: 0, existing: 2 })
    const active = await mongo.database.collection('eventEntries').findOne({ _id: activeEntryId })
    const archived = await mongo.database.collection('eventEntries').findOne({ _id: archivedEntryId })
    expect(active).toMatchObject({ eventId, ownerAccountId: participantId, categoryId, status: 'active' })
    expect(archived).toMatchObject({ status: 'archived', archiveReason: 'legacy_registration_removed',
      archivedByAccountId: SYSTEM_MIGRATION_ACTOR_ID })
  })
})
