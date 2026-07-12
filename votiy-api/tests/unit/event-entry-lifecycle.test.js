import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { createEventEntryDocument, toParticipantCard } from '../../src/domain/event-entry.js'

const NOW = new Date('2026-07-12T12:00:00.000Z')
const ids = {
  event: new ObjectId(), category: new ObjectId(), owner: new ObjectId(), creator: new ObjectId(),
}

describe('standalone event entry lifecycle', () => {
  it('creates an active entry with immutable ownership and null archive metadata', () => {
    const entry = createEventEntryDocument({ ...ids, eventId: ids.event, categoryId: ids.category,
      ownerAccountId: ids.owner, createdByAccountId: ids.creator, title: ' Pie ', now: NOW })
    expect(entry).toMatchObject({ title: 'Pie', status: 'active', archiveReason: null,
      archivedAt: null, archivedByAccountId: null, updatedAt: NOW })
    expect(Object.isFrozen(entry)).toBe(true)
  })

  it('requires complete, allowlisted archive metadata', () => {
    expect(() => createEventEntryDocument({ eventId: ids.event, categoryId: ids.category,
      ownerAccountId: ids.owner, createdByAccountId: ids.creator, title: 'Pie', status: 'archived', now: NOW }))
      .toThrow('archive metadata')
    expect(() => createEventEntryDocument({ eventId: ids.event, categoryId: ids.category,
      ownerAccountId: ids.owner, createdByAccountId: ids.creator, title: 'Pie', status: 'archived',
      archiveReason: 'deleted', archivedAt: NOW, archivedByAccountId: ids.creator, now: NOW }))
      .toThrow('Invalid archive reason')
  })

  it('projects one participant from active entries only', () => {
    const account = { _id: ids.owner, displayName: 'Peyton', emailNormalized: 'peyton@example.test' }
    const entry = createEventEntryDocument({ eventId: ids.event, categoryId: ids.category,
      ownerAccountId: ids.owner, createdByAccountId: ids.creator, title: 'Pie', now: NOW })
    expect(toParticipantCard([entry], account)).toMatchObject({ displayName: 'Peyton',
      email: 'peyton@example.test', entryCount: 1, entries: [{ title: 'Pie', status: 'ACTIVE' }] })
  })
})
