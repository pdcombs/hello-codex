import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createEventService } from '../../src/services/event-service.js'

const NOW = new Date('2026-07-07T02:00:00.000Z')
const VIEWER = {
  account: {
    _id: 'account-1',
    verificationStatus: 'verified',
  },
}
const INPUT = {
  title: ' Team awards ',
  description: ' Nice work ',
  location: ' Atrium ',
  registrationPolicy: 'OPEN',
  idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
}

function createHarness(overrides = {}) {
  const event = {
    _id: 'event-1',
    ownerAccountId: 'account-1',
    publicId: 'public-event-1',
    title: 'Team awards',
    description: 'Nice work',
    location: 'Atrium',
    registrationPolicy: 'open',
    createdAt: NOW,
    updatedAt: NOW,
  }
  const eventRepository = {
    create: vi.fn().mockResolvedValue(event),
    findById: vi.fn().mockResolvedValue(event),
    findByPublicId: vi.fn().mockResolvedValue(event),
    listByOwner: vi.fn().mockResolvedValue([event]),
    updateRegistrationPolicy: vi.fn().mockResolvedValue({ ...event, registrationPolicy: 'admin_managed' }),
  }
  const idempotencyRepository = {
    find: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(undefined),
  }
  const service = createEventService({
    eventRepository,
    idempotencyRepository,
    generatePublicId: vi.fn().mockReturnValue('public-event-1'),
    digestRequest: vi.fn().mockReturnValue('request-digest'),
    now: vi.fn().mockReturnValue(NOW),
    logger: { info: vi.fn() },
    ...overrides,
  })
  return { service, eventRepository, idempotencyRepository, event }
}

describe('event service', () => {
  it('creates owner event with stable idempotency and publicId', async () => {
    const harness = createHarness()
    const result = await harness.service.createEvent(INPUT, VIEWER)

    expect(harness.eventRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      ownerAccountId: 'account-1',
      publicId: 'public-event-1',
      title: 'Team awards',
      registrationPolicy: 'open',
    }))
    expect(harness.idempotencyRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'account-1',
      operation: 'createEvent',
      key: INPUT.idempotencyKey,
      requestDigest: 'request-digest',
    }))
    expect(result.event).toMatchObject({
      publicId: 'public-event-1',
      title: 'Team awards',
      registrationPolicy: 'OPEN',
      isOwner: true,
    })
  })

  it('rejects anonymous and unverified event creation', async () => {
    const harness = createHarness()
    await expect(harness.service.createEvent(INPUT, null)).rejects.toMatchObject({ code: ErrorCode.AUTHENTICATION_REQUIRED })
    await expect(harness.service.createEvent(INPUT, { account: { _id: 'account-1', verificationStatus: 'pending' } }))
      .rejects.toMatchObject({ code: ErrorCode.EMAIL_NOT_VERIFIED })
  })

  it('returns idempotent prior event without duplicate write', async () => {
    const harness = createHarness()
    harness.idempotencyRepository.find.mockResolvedValue({
      requestDigest: 'request-digest',
      resultReference: { eventId: 'event-1' },
    })

    const result = await harness.service.createEvent(INPUT, VIEWER)

    expect(harness.eventRepository.create).not.toHaveBeenCalled()
    expect(result.event.id).toBe('event-1')
  })

  it('lists owned events and direct-link reads with ownership flag', async () => {
    const harness = createHarness()
    const listed = await harness.service.ownedEvents({ viewer: VIEWER, first: 20, after: null })
    const viewed = await harness.service.eventByPublicId({ publicId: 'public-event-1', viewer: VIEWER })

    expect(listed.events.nodes).toHaveLength(1)
    expect(viewed.event.isOwner).toBe(true)
  })

  it('changes registration policy only for owner', async () => {
    const harness = createHarness()
    const result = await harness.service.setRegistrationPolicy({
      eventId: 'event-1',
      registrationPolicy: 'ADMIN_MANAGED',
    }, VIEWER)

    expect(result.event.registrationPolicy).toBe('ADMIN_MANAGED')
    harness.eventRepository.updateRegistrationPolicy.mockResolvedValue(null)
    await expect(harness.service.setRegistrationPolicy({
      eventId: 'event-1',
      registrationPolicy: 'OPEN',
    }, VIEWER)).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN })
  })
})
