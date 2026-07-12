import { ObjectId } from 'mongodb'
import { Writable } from 'node:stream'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runEventSetupMigration } from '../../src/migrations/002-event-categories-entries.js'
import { enforceEventSetupValidators, ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'
import { createLogger } from '../../src/observability/logger.js'

describe('event setup migration', () => {
  let mongo
  beforeAll(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
  })
  afterAll(async () => mongo?.cleanup())

  it('migrates all statuses deterministically and safely restarts', async () => {
    let logs = ''
    const destination = new Writable({ write(chunk, _encoding, done) { logs += chunk; done() } })
    const logger = createLogger({}, destination)
    const hostId = new ObjectId()
    const emailId = new ObjectId()
    const phoneId = new ObjectId()
    const eventId = new ObjectId()
    const baseAccount = {
      referredByAccountId: null, lifecycleStatus: 'provisional', passwordHash: null,
      verificationStatus: 'pending', verifiedAt: null, credentialVersion: 0,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), schemaVersion: 1,
    }
    await mongo.database.collection('accounts').insertMany([
      { ...baseAccount, _id: hostId, emailNormalized: 'host@example.test', phoneNormalized: null },
      { ...baseAccount, _id: emailId, emailNormalized: 'Peyton@example.test', phoneNormalized: null },
      { ...baseAccount, _id: phoneId, emailNormalized: null, phoneNormalized: '+15555550100' },
    ])
    await mongo.database.collection('events').insertOne({
      _id: eventId, ownerAccountId: hostId, publicId: 'migration-event', title: 'Peyton Event',
      description: null, location: null, registrationPolicy: 'admin_managed',
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), schemaVersion: 1,
    })
    const registrationBase = {
      eventId, registrationSource: 'host', registeredByAccountId: hostId, removedAt: null,
      createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02'), schemaVersion: 1,
    }
    await mongo.database.collection('eventRegistrations').insertMany([
      { ...registrationBase, accountId: emailId, status: 'registered' },
      { ...registrationBase, accountId: phoneId, status: 'removed', removedAt: new Date('2026-02-01') },
    ])

    const first = await runEventSetupMigration({ database: mongo.database, logger })
    const second = await runEventSetupMigration({ database: mongo.database, logger })
    expect(first).toMatchObject({ accounts: 3, events: 1, registrations: 2 })
    expect(second).toMatchObject({ accounts: 0, events: 0, registrations: 0 })

    const accounts = await mongo.database.collection('accounts').find().sort({ _id: 1 }).toArray()
    expect(accounts.find(({ _id }) => _id.equals(emailId)).displayName).toBe('Peyton')
    expect(accounts.find(({ _id }) => _id.equals(phoneId)).displayName).toBe('Participant 1')
    const event = await mongo.database.collection('events').findOne({ _id: eventId })
    expect(event.categories[0]).toMatchObject({ title: 'Peyton Event participants', isDefault: true })
    const registrations = await mongo.database.collection('eventRegistrations').find({ eventId }).toArray()
    expect(registrations.map(({ status }) => status).sort()).toEqual(['registered', 'removed'])
    expect(registrations.map(({ entries }) => entries[0].title).sort()).toEqual(['Entry 1', 'Entry 2'])
    expect(await mongo.database.collection('migrationCheckpoints').countDocuments()).toBe(3)
    expect(logs).toContain('migration.stage.completed')
    expect(logs).not.toContain('Peyton@example.test')
    expect(logs).not.toContain('+15555550100')
    expect(logs).not.toContain('Peyton Event')
    await expect(enforceEventSetupValidators(mongo.database)).resolves.toBeUndefined()
    expect(await mongo.database.collection('accounts').countDocuments({ schemaVersion: 1 })).toBe(0)
    expect(await mongo.database.collection('events').countDocuments({ schemaVersion: 1 })).toBe(0)
    expect(await mongo.database.collection('eventRegistrations').countDocuments({ schemaVersion: 1 })).toBe(0)
  })
})
