import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createEventRegistrationRepository } from '../../src/repositories/event-registration-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventRegistrationService } from '../../src/services/event-registration-service.js'
import { createEventService } from '../../src/services/event-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('event lifecycle with real MongoDB', () => {
  let mongo
  let accountRepository
  let eventRepository
  let eventRegistrationRepository
  let idempotencyRepository
  let eventService
  let eventRegistrationService
  let owner

  beforeEach(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
    accountRepository = createAccountRepository(mongo.database)
    eventRepository = createEventRepository(mongo.database)
    eventRegistrationRepository = createEventRegistrationRepository(mongo.database)
    idempotencyRepository = createIdempotencyRepository(mongo.database)
    eventService = createEventService({ eventRepository, idempotencyRepository })
    eventRegistrationService = createEventRegistrationService({
      eventRepository,
      eventRegistrationRepository,
      accountRepository,
      idempotencyRepository,
    })
    owner = await accountRepository.createPending({
      emailNormalized: 'host@example.com',
      passwordHash: 'hash',
      referredByAccountId: null,
    })
    await accountRepository.markVerified(owner._id, new Date('2026-07-07T02:00:00.000Z'))
    owner = await accountRepository.findById(owner._id)
  })

  afterEach(async () => {
    await mongo?.cleanup?.()
  })

  it('creates events, reads direct links, self-registers open events, adds provisional participants, and removes them', async () => {
    const viewer = { account: owner }
    const adminManaged = await eventService.createEvent({
      title: 'Board meeting',
      description: null,
      location: null,
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }, viewer)
    const open = await eventService.createEvent({
      title: 'Volunteer dinner',
      description: 'Everyone welcome',
      location: 'Atrium',
      registrationPolicy: 'OPEN',
      idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
    }, viewer)

    const read = await eventService.eventByPublicId({ publicId: open.event.publicId, viewer: null })
    expect(read.event.title).toBe('Volunteer dinner')

    const attendee = await accountRepository.createPending({
      emailNormalized: 'attendee@example.com',
      passwordHash: 'hash',
      referredByAccountId: null,
    })
    await accountRepository.markVerified(attendee._id, new Date('2026-07-07T02:01:00.000Z'))
    const attendeeViewer = { account: await accountRepository.findById(attendee._id) }
    const selfRegistration = await eventRegistrationService.registerForEvent({
      eventId: open.event.id,
      idempotencyKey: '784f55ee-5d4d-1fde-8e3e-2495635476e1',
    }, attendeeViewer)
    expect(selfRegistration.registration.source).toBe('SELF')

    const hostRegistration = await eventRegistrationService.addParticipant({
      eventId: adminManaged.event.id,
      displayName: 'Hosted Participant',
      email: 'hosted-participant@example.test',
      phone: '+14155550123',
      idempotencyKey: '82cc7674-c717-40d8-a158-f54db62ac41e',
    }, viewer)
    expect(hostRegistration.registration.accountCompleted).toBe(false)

    const registrations = await eventRegistrationService.listRegistrations({ eventId: adminManaged.event.id }, viewer)
    expect(registrations.registrations).toHaveLength(1)

    const removed = await eventRegistrationService.removeParticipant({
      eventId: adminManaged.event.id,
      registrationId: hostRegistration.registration.id,
    }, viewer)
    expect(removed.registration.status).toBe('REMOVED')
  })
})
