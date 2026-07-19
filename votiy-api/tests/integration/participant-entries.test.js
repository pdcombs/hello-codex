import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventRegistrationRepository } from '../../src/repositories/event-registration-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { createEventVoterAccessRepository } from '../../src/repositories/event-voter-access-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventRegistrationService } from '../../src/services/event-registration-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('participant entries transaction', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('atomically creates provisional participant with categorized entries and rolls back invalid input', async () => {
    const accountRepository = createAccountRepository(mongo.database)
    const eventRepository = createEventRepository(mongo.database)
    const registrationRepository = createEventRegistrationRepository(mongo.database)
    const idempotencyRepository = createIdempotencyRepository(mongo.database)
    const host = await accountRepository.createPending({ displayName: 'Host', emailNormalized: 'entry-host@example.test', passwordHash: 'hash' })
    const event = await eventRepository.create({ schemaVersion: 2, ownerAccountId: host._id, publicId: 'participant-entry-test', title: 'Entry Test' })
    const categoryId = event.categories[0]._id
    const service = createEventRegistrationService({ eventRepository, eventRegistrationRepository: registrationRepository,
      accountRepository, idempotencyRepository, withTransaction: async (operation) => {
        const session = mongo.client.startSession(); try { let value; await session.withTransaction(async () => { value = await operation(session) }); return value } finally { await session.endSession() }
      } })
    const viewer = { account: { ...host, verificationStatus: 'verified' } }
    const result = await service.addParticipant({ eventId: String(event._id), displayName: 'Participant',
      email: 'participant-entry@example.test', entries: [
        { title: 'First', categoryId: String(categoryId) }, { title: 'Second', categoryId: String(categoryId) },
      ], idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' }, viewer)
    expect(result.registration).toMatchObject({ displayName: 'Participant', entryCount: 2 })
    expect(result.registration.entries.map(({ title }) => title)).toEqual(['First', 'Second'])

    const before = await mongo.database.collection('accounts').countDocuments()
    await expect(service.addParticipant({ eventId: String(event._id), displayName: 'Invalid', email: 'rollback@example.test',
      entries: [{ title: 'Bad', categoryId: String(new ObjectId()) }],
      idempotencyKey: '123e4567-e89b-12d3-a456-426614174000' }, viewer)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    expect(await mongo.database.collection('accounts').countDocuments()).toBe(before)
  })

  it('does not project event voter access as participant registration', async () => {
    const accountRepository = createAccountRepository(mongo.database)
    const eventRepository = createEventRepository(mongo.database)
    const registrationRepository = createEventRegistrationRepository(mongo.database)
    const host = await accountRepository.createPending({ displayName: 'Voter Host',
      emailNormalized: 'voter-host@example.test', passwordHash: 'hash' })
    const voter = await accountRepository.createProvisional({ displayName: 'Voter',
      emailNormalized: 'only-voter@example.test', referredByAccountId: null })
    const event = await eventRepository.create({ schemaVersion: 2, ownerAccountId: host._id,
      publicId: 'voter-not-participant', title: 'Voter Test' })
    await createEventVoterAccessRepository(mongo.database).grant({ eventId: event._id, accountId: voter._id,
      source: 'code', codeId: new ObjectId(), now: new Date() })
    const service = createEventRegistrationService({ eventRepository,
      eventRegistrationRepository: registrationRepository, accountRepository,
      idempotencyRepository: createIdempotencyRepository(mongo.database) })
    expect((await service.listRegistrations({ eventId: String(event._id) },
      { account: { ...host, verificationStatus: 'verified' } })).registrations).toEqual([])
  })
})
