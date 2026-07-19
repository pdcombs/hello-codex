import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { toEntryOwnerChoice } from '../../src/domain/event-entry.js'
import { createEventEntryInputSchema, entryOwnerChoicesInputSchema } from '../../src/domain/validation.js'
import { createEventAccessService } from '../../src/services/event-access-service.js'

const uuid = '123e4567-e89b-42d3-a456-426614174000'

describe('add entry foundation', () => {
  it('requires exactly one owner source and valid provisional contact', () => {
    const base = { eventId: 'event', categoryId: 'category', title: 'Entry', idempotencyKey: uuid }
    expect(createEventEntryInputSchema.safeParse(base).success).toBe(false)
    expect(createEventEntryInputSchema.safeParse({ ...base, accountId: 'account',
      provisionalOwner: { displayName: 'Person', email: 'person@example.test' } }).success).toBe(false)
    expect(createEventEntryInputSchema.safeParse({ ...base,
      provisionalOwner: { displayName: 'Person' } }).success).toBe(false)
    expect(createEventEntryInputSchema.safeParse({ ...base, accountId: 'account' }).success).toBe(true)
  })

  it('enforces choice bounds and searchable characters', () => {
    expect(entryOwnerChoicesInputSchema.safeParse({ eventId: 'event', search: 'ab', first: 10 }).success).toBe(false)
    expect(entryOwnerChoicesInputSchema.safeParse({ eventId: 'event', search: 'abc', first: 10 }).success).toBe(true)
    expect(entryOwnerChoicesInputSchema.safeParse({ eventId: 'event', search: 'abc', first: 11 }).success).toBe(false)
  })

  it('projects only allowed owner-choice identity fields', () => {
    const account = { _id: new ObjectId(), displayName: 'Person', emailNormalized: 'person@example.test',
      phoneNormalized: '+15551234567', passwordHash: 'secret' }
    expect(toEntryOwnerChoice(account)).toEqual({ accountId: String(account._id), displayName: 'Person',
      email: 'person@example.test', phone: '+15551234567', isEventParticipant: false,
      latestEntryCreatedAt: null })
  })

  it('allows owner and denies another account without leaking event', async () => {
    const ownerId = new ObjectId()
    const service = createEventAccessService({ eventRepository: { findById: async () => ({ ownerAccountId: ownerId }) } })
    await expect(service.requireManager('event', { account: { _id: ownerId } })).resolves.toBeDefined()
    await expect(service.requireManager('event', { account: { _id: new ObjectId() } }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
