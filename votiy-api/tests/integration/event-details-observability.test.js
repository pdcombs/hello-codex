import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createEventService } from '../../src/services/event-service.js'

describe('event detail observability privacy', () => {
  it('records safe operation, correlation, changed count, and duration without event text', async () => {
    const owner = new ObjectId(); const event = { _id: new ObjectId(), ownerAccountId: owner, publicId: 'safe-id',
      title: 'Secret old title', description: null, location: null, lifecycleStatus: 'active', visibility: 'public',
      registrationPolicy: 'open', categories: [], votingRules: null, createdAt: new Date('2030-01-01T00:00:00Z'),
      updatedAt: new Date('2030-01-01T01:00:00Z') }
    const logger = { info: vi.fn() }
    const service = createEventService({ eventRepository: { findById: vi.fn().mockResolvedValue(event),
      updateDetails: vi.fn().mockResolvedValue({ ...event, title: 'Secret new title', updatedAt: new Date() }) },
    idempotencyRepository: {}, logger })
    await service.updateDetails({ eventId: String(event._id), title: 'Secret new title', description: null,
      location: null, expectedUpdatedAt: event.updatedAt }, { account: { _id: owner } }, { correlationId: 'safe-correlation' })
    const metadata = logger.info.mock.calls[0][0]
    expect(metadata).toMatchObject({ operation: 'event.details_update', outcome: 'success',
      correlationId: 'safe-correlation', changedFieldCount: 1, durationMs: expect.any(Number) })
    expect(JSON.stringify(metadata)).not.toMatch(/Secret|title|description|location|voting|code|ballot/i)
  })
})
