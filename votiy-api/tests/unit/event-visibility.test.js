import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { assertActiveEvent, eventDetailAccess, privateEventSummary, visibilityAuditEvent } from '../../src/domain/event-visibility.js'

describe('event visibility domain', () => {
  const ownerAccountId = new ObjectId()
  const event = { _id: new ObjectId(), ownerAccountId, publicId: 'evt', title: 'Private',
    description: 'Summary', visibility: 'private', lifecycleStatus: 'active' }

  it('selects access from identity, not navigation source', () => {
    expect(eventDetailAccess(event, ownerAccountId)).toBe('FULL')
    expect(eventDetailAccess(event, new ObjectId())).toBe('PRIVATE_SUMMARY')
    expect(eventDetailAccess({ ...event, lifecycleStatus: 'archived' }, ownerAccountId)).toBe('ARCHIVED_READ_ONLY')
    expect(eventDetailAccess({ ...event, lifecycleStatus: 'archived' }, new ObjectId())).toBe('NONE')
    expect(eventDetailAccess({ ...event, visibility: 'public' }, null)).toBe('FULL')
    expect(assertActiveEvent(event)).toBe(event)
    expect(() => assertActiveEvent({ ...event, lifecycleStatus: 'archived' })).toThrow()
  })

  it('creates a data-minimized read-time private summary', () => {
    expect(privateEventSummary(event, { categoryCount: 1, participantCount: 2, entryCount: 3 })).toEqual({
      __typename: 'PrivateEventSummary', publicId: 'evt', title: 'Private', description: 'Summary',
      visibility: 'PRIVATE', lifecycleStatus: 'ACTIVE', detailAccess: 'PRIVATE_SUMMARY',
      categoryCount: 1, participantCount: 2, entryCount: 3,
    })
  })

  it('builds privacy-safe audit payloads', () => {
    expect(visibilityAuditEvent({ action: 'visibility_changed', outcome: 'success', event,
      requestedVisibility: 'public', correlationId: 'correlation' })).toMatchObject({
      name: 'event.visibility_changed', outcome: 'success',
      metadata: { priorVisibility: 'private', requestedVisibility: 'public' },
    })
  })
})
