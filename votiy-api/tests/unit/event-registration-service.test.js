import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createEventRegistrationService } from '../../src/services/event-registration-service.js'

const NOW = new Date('2026-07-07T02:00:00.000Z')
const OWNER = { account: { _id: 'owner-1', verificationStatus: 'verified' } }
const PARTICIPANT = {
  _id: 'account-2',
  emailNormalized: 'member@example.com',
  phoneNormalized: null,
  lifecycleStatus: 'completed',
}

function createHarness(overrides = {}) {
  const event = {
    _id: 'event-1',
    ownerAccountId: 'owner-1',
    publicId: 'public-event-1',
    registrationPolicy: 'open',
  }
  const registration = {
    _id: 'registration-1',
    eventId: 'event-1',
    accountId: 'account-2',
    status: 'registered',
    registrationSource: 'host',
    createdAt: NOW,
  }
  const eventRepository = {
    findById: vi.fn().mockResolvedValue(event),
  }
  const eventRegistrationRepository = {
    findById: vi.fn().mockResolvedValue(registration),
    findByEventAndAccount: vi.fn().mockResolvedValue(null),
    listByEvent: vi.fn().mockResolvedValue([registration]),
    create: vi.fn().mockResolvedValue(registration),
    revive: vi.fn().mockResolvedValue({ ...registration, status: 'registered' }),
    remove: vi.fn().mockResolvedValue({ ...registration, status: 'removed', removedAt: NOW }),
  }
  const accountRepository = {
    findById: vi.fn().mockResolvedValue(PARTICIPANT),
    findByIds: vi.fn().mockResolvedValue([PARTICIPANT]),
    findByEmailNormalized: vi.fn().mockResolvedValue(PARTICIPANT),
    findByPhoneNormalized: vi.fn().mockResolvedValue(null),
    createProvisional: vi.fn().mockResolvedValue({
      _id: 'account-3',
      emailNormalized: null,
      phoneNormalized: '+14155550123',
      lifecycleStatus: 'provisional',
    }),
  }
  const idempotencyRepository = {
    find: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(undefined),
  }
  const service = createEventRegistrationService({
    eventRepository,
    eventRegistrationRepository,
    accountRepository,
    idempotencyRepository,
    digestRequest: vi.fn().mockReturnValue('request-digest'),
    now: vi.fn().mockReturnValue(NOW),
    logger: { info: vi.fn() },
    ...overrides,
  })
  return { service, eventRepository, eventRegistrationRepository, accountRepository, idempotencyRepository, event, registration }
}

describe('event registration service', () => {
  it('self-registers verified account only for open event', async () => {
    const harness = createHarness()
    const viewer = { account: { _id: 'account-2', verificationStatus: 'verified', ...PARTICIPANT } }
    harness.eventRegistrationRepository.create.mockResolvedValue({
      ...harness.registration,
      accountId: 'account-2',
      registrationSource: 'self',
    })
    const result = await harness.service.registerForEvent({
      eventId: 'event-1',
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }, viewer)

    expect(result.registration.source).toBe('SELF')
    harness.eventRepository.findById.mockResolvedValue({ ...harness.event, registrationPolicy: 'admin_managed' })
    await expect(harness.service.registerForEvent({
      eventId: 'event-1',
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }, viewer)).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN })
  })

  it('adds participant by reusing existing account or creating provisional account', async () => {
    const harness = createHarness()
    const reused = await harness.service.addParticipant({
      eventId: 'event-1',
      email: 'member@example.com',
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }, OWNER)
    expect(reused.provisionalCreated).toBe(false)

    harness.accountRepository.findByEmailNormalized.mockResolvedValue(null)
    const provisional = await harness.service.addParticipant({
      eventId: 'event-1',
      email: 'phone-owner@example.com',
      phone: '+14155550123',
      idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
    }, OWNER)
    expect(harness.accountRepository.createProvisional).toHaveBeenCalled()
    expect(provisional.provisionalCreated).toBe(true)

    await expect(harness.service.addParticipant({
      eventId: 'event-1',
      email: 'email-only@example.com',
      phone: null,
      idempotencyKey: '93b45d0b-f436-4956-9c31-7442fbe3086d',
    }, OWNER)).resolves.toMatchObject({ provisionalCreated: true })

    harness.accountRepository.findByEmailNormalized.mockResolvedValue(null)
    await harness.service.addParticipant({
      eventId: 'event-1',
      email: 'both@example.com',
      phone: '+14155550124',
      idempotencyKey: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    }, OWNER)
    expect(harness.accountRepository.createProvisional).toHaveBeenLastCalledWith(expect.objectContaining({
      emailNormalized: 'both@example.com',
      phoneNormalized: '+14155550124',
    }))
  })

  it('lists and removes registrations for owner only', async () => {
    const harness = createHarness()
    const listed = await harness.service.listRegistrations({ eventId: 'event-1' }, OWNER)
    expect(listed.registrations).toHaveLength(1)

    const removed = await harness.service.removeParticipant({
      eventId: 'event-1',
      registrationId: 'registration-1',
    }, OWNER)
    expect(removed.registration.status).toBe('REMOVED')

    harness.eventRepository.findById.mockResolvedValue({ ...harness.event, ownerAccountId: 'someone-else' })
    await expect(harness.service.listRegistrations({ eventId: 'event-1' }, OWNER)).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
    })
  })
})
