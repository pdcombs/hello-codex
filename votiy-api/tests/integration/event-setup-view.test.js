import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCategory } from '../../src/domain/event-category.js'
import { createEntry } from '../../src/domain/event-entry.js'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventRegistrationRepository } from '../../src/repositories/event-registration-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventService } from '../../src/services/event-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('grouped setup view performance', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('groups 100 categories, 1,000 participants, and 5,000 entries within two seconds', async () => {
    const now = new Date('2026-07-01')
    const ownerId = new ObjectId()
    const categories = Array.from({ length: 100 }, (_, index) => createCategory({
      title: `Category ${index + 1}`, isDefault: index === 0, now,
    }))
    const eventId = new ObjectId()
    await mongo.database.collection('events').insertOne({ _id: eventId, ownerAccountId: ownerId,
      publicId: 'large-grouped-view', title: 'Large event', description: null, location: null,
      registrationPolicy: 'open', categories, createdAt: now, updatedAt: now, schemaVersion: 2 })
    const accounts = Array.from({ length: 1_000 }, (_, index) => ({ _id: new ObjectId(), displayName: `Participant ${index + 1}`,
      emailNormalized: `participant-${index}@example.test`, phoneNormalized: null, referredByAccountId: ownerId,
      lifecycleStatus: 'provisional', passwordHash: null, verificationStatus: 'pending', verifiedAt: null,
      credentialVersion: 0, createdAt: now, updatedAt: now, schemaVersion: 2 }))
    await mongo.database.collection('accounts').insertMany(accounts)
    const registrations = accounts.map((account, participantIndex) => ({ _id: new ObjectId(), eventId,
      accountId: account._id, status: 'registered', registrationSource: 'host', registeredByAccountId: ownerId,
      removedAt: null, entries: Array.from({ length: 5 }, (_, entryIndex) => createEntry({
        title: `Entry ${participantIndex + 1}-${entryIndex + 1}`,
        categoryId: categories[(participantIndex * 5 + entryIndex) % categories.length]._id,
        createdByAccountId: ownerId, now,
      })), createdAt: now, updatedAt: now, schemaVersion: 2 }))
    await mongo.database.collection('eventRegistrations').insertMany(registrations)

    const service = createEventService({ eventRepository: createEventRepository(mongo.database),
      eventRegistrationRepository: createEventRegistrationRepository(mongo.database),
      accountRepository: createAccountRepository(mongo.database), idempotencyRepository: {} })
    const startedAt = performance.now()
    const result = await service.eventByPublicId({ publicId: 'large-grouped-view' })
    const durationMs = performance.now() - startedAt
    expect(durationMs).toBeLessThan(2_000)
    expect(result.event.categories).toHaveLength(100)
    expect(result.event.categories.reduce((sum, category) => sum + category.entries.length, 0)).toBe(5_000)
  })
})
