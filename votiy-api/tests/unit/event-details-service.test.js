import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createEventService } from '../../src/services/event-service.js'

const ownerId = new ObjectId()
const baseEvent = () => ({ _id: new ObjectId(), ownerAccountId: ownerId, publicId: 'event-1', title: 'Old',
  description: 'Old description', location: 'Old place', registrationPolicy: 'open', categories: [],
  visibility: 'public', lifecycleStatus: 'active', votingRules: null, createdAt: new Date('2030-01-01T00:00:00Z'),
  updatedAt: new Date('2030-01-01T01:00:00Z') })

function service(event = baseEvent()) {
  const eventRepository = { findById: vi.fn().mockResolvedValue(event),
    updateDetails: vi.fn(async (_id, _owner, _expected, details, now) => ({ ...event, ...details, updatedAt: now })) }
  return { eventRepository, value: createEventService({ eventRepository, idempotencyRepository: {},
    now: () => new Date('2030-01-01T02:00:00Z'), logger: { info: vi.fn() } }) }
}

describe('event detail update service', () => {
  it('normalizes fields and performs owner timestamp compare-and-set', async () => {
    const { value, eventRepository } = service()
    const result = await value.updateDetails({ eventId: String((await eventRepository.findById())._id),
      title: ' New title ', description: ' ', location: ' New place ',
      expectedUpdatedAt: '2030-01-01T01:00:00Z' }, { account: { _id: ownerId } }, { correlationId: 'c1' })
    expect(result.event).toMatchObject({ title: 'New title', description: null, location: 'New place' })
    expect(eventRepository.updateDetails).toHaveBeenCalledWith(expect.anything(), ownerId,
      new Date('2030-01-01T01:00:00Z'), { title: 'New title', description: null, location: 'New place' },
      new Date('2030-01-01T02:00:00Z'))
  })

  it('rejects invalid, unauthorized, archived, and stale changes', async () => {
    const { value } = service()
    await expect(value.updateDetails({ eventId: 'x', title: ' ', expectedUpdatedAt: new Date() },
      { account: { _id: ownerId } })).rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED })
    await expect(value.updateDetails({ eventId: String(new ObjectId()), title: 'New',
      expectedUpdatedAt: '2030-01-01T01:00:00Z' }, { account: { _id: new ObjectId() } }))
      .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN })
    const archived = service({ ...baseEvent(), lifecycleStatus: 'archived' })
    await expect(archived.value.updateDetails({ eventId: String(new ObjectId()), title: 'New',
      expectedUpdatedAt: '2030-01-01T01:00:00Z' }, { account: { _id: ownerId } }))
      .rejects.toMatchObject({ code: ErrorCode.CONFLICT })
    const stale = service()
    await expect(stale.value.updateDetails({ eventId: String(new ObjectId()), title: 'New',
      expectedUpdatedAt: '2030-01-01T00:00:00Z' }, { account: { _id: ownerId } }))
      .rejects.toMatchObject({ code: ErrorCode.CONFLICT })
  })
})
