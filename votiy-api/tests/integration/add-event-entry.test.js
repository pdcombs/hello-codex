import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventAccessService } from '../../src/services/event-access-service.js'
import { createEventEntryService } from '../../src/services/event-entry-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('add one event entry transaction', () => {
  let mongo
  let service
  let accountRepository
  let entryRepository
  let eventRepository
  let host
  let existing
  let event
  let categoryId

  beforeAll(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
    accountRepository = createAccountRepository(mongo.database)
    entryRepository = createEventEntryRepository(mongo.database)
    eventRepository = createEventRepository(mongo.database)
    const idempotencyRepository = createIdempotencyRepository(mongo.database)
    host = await accountRepository.createPending({ displayName: 'Host Person',
      emailNormalized: 'add-entry-host@example.test', passwordHash: 'hash' })
    existing = await accountRepository.createProvisional({ displayName: 'Existing Person',
      emailNormalized: 'existing-person@example.test', phoneNormalized: '+15551234567',
      referredByAccountId: host._id })
    event = await eventRepository.create({ schemaVersion: 2, ownerAccountId: host._id,
      publicId: 'add-entry-integration', title: 'Add Entry Integration' })
    categoryId = event.categories[0]._id
    const eventAccessService = createEventAccessService({ eventRepository })
    service = createEventEntryService({ eventRepository, eventEntryRepository: entryRepository,
      accountRepository, idempotencyRepository, eventAccessService,
      withTransaction: async (operation) => {
        const session = mongo.client.startSession()
        try {
          let value
          await session.withTransaction(async () => { value = await operation(session) })
          return value
        } finally { await session.endSession() }
      },
    })
  })

  afterAll(async () => mongo?.cleanup())

  it('creates existing-owner entry, derives participant, and replays idempotently', async () => {
    const input = { eventId: String(event._id), categoryId: String(categoryId), title: 'Existing entry',
      accountId: String(existing._id), idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }
    const first = await service.createEntry(input, { account: host })
    const replay = await service.createEntry(input, { account: host })
    expect(first.createdEntries).toHaveLength(1)
    expect(replay.createdEntries[0].id).toBe(first.createdEntries[0].id)
    expect(await mongo.database.collection('eventEntries').countDocuments({ title: 'Existing entry' })).toBe(1)
  })

  it('orders recent owners, searches indexed contacts, and blocks nonowner', async () => {
    const recent = await service.entryOwnerChoices({ eventId: String(event._id), search: null, first: 10 }, { account: host })
    expect(recent.choices[0]).toMatchObject({ accountId: String(existing._id), isEventParticipant: true })
    const searched = await service.entryOwnerChoices({ eventId: String(event._id), search: 'existing', first: 10 }, { account: host })
    expect(searched.choices[0].email).toBe('existing-person@example.test')
    await expect(service.entryOwnerChoices({ eventId: String(event._id), search: 'existing', first: 10 },
      { account: { _id: new ObjectId() } })).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('atomically creates provisional owner and entry and rolls back invalid category', async () => {
    const created = await service.createEntry({ eventId: String(event._id), categoryId: String(categoryId),
      title: 'New owner entry', provisionalOwner: { displayName: 'New Person', email: 'new-owner@example.test' },
      idempotencyKey: '223e4567-e89b-42d3-a456-426614174000' }, { account: host })
    expect(created.provisionalCreated).toBe(true)
    expect(created.affectedParticipant.entryCount).toBe(1)

    const before = await mongo.database.collection('accounts').countDocuments()
    await expect(service.createEntry({ eventId: String(event._id), categoryId: String(new ObjectId()),
      title: 'Invalid', provisionalOwner: { displayName: 'Rollback', email: 'rollback-owner@example.test' },
      idempotencyKey: '323e4567-e89b-42d3-a456-426614174000' }, { account: host }))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    expect(await mongo.database.collection('accounts').countDocuments()).toBe(before)
  })

  it('resolves concurrent provisional requests to one account identity', async () => {
    const contact = 'concurrent-owner@example.test'
    const base = { eventId: String(event._id), categoryId: String(categoryId),
      provisionalOwner: { displayName: 'Concurrent Person', email: contact } }
    const [first, second] = await Promise.all([
      service.createEntry({ ...base, title: 'Concurrent one',
        idempotencyKey: '423e4567-e89b-42d3-a456-426614174000' }, { account: host }),
      service.createEntry({ ...base, title: 'Concurrent two',
        idempotencyKey: '523e4567-e89b-42d3-a456-426614174000' }, { account: host }),
    ])
    expect(new Set([first.affectedParticipant.accountId, second.affectedParticipant.accountId]).size).toBe(1)
    expect(await mongo.database.collection('accounts').countDocuments({ emailNormalized: contact })).toBe(1)
    expect(await mongo.database.collection('eventEntries').countDocuments({
      title: { $in: ['Concurrent one', 'Concurrent two'] }, status: 'active',
    })).toBe(2)
  })
})
