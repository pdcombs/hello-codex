import { ObjectId } from 'mongodb'
import { createEventEntryDocument } from '../../src/domain/event-entry.js'

export function entryFixture(overrides = {}) {
  const now = overrides.now ?? new Date('2026-07-12T12:00:00.000Z')
  return createEventEntryDocument({
    id: overrides.id ?? new ObjectId(), eventId: overrides.eventId ?? new ObjectId(),
    categoryId: overrides.categoryId ?? new ObjectId(), ownerAccountId: overrides.ownerAccountId ?? new ObjectId(),
    createdByAccountId: overrides.createdByAccountId ?? new ObjectId(), title: overrides.title ?? 'Entry',
    status: overrides.status ?? 'active', archiveReason: overrides.archiveReason ?? null,
    archivedAt: overrides.archivedAt ?? null, archivedByAccountId: overrides.archivedByAccountId ?? null, now,
  })
}

export function participantFixture(overrides = {}) {
  const accountId = overrides.accountId ?? new ObjectId().toString()
  const entries = overrides.entries ?? [{ id: new ObjectId().toString(), title: 'Entry 1' }]
  return Object.freeze({ accountId, displayName: overrides.displayName ?? 'Participant',
    email: overrides.email ?? 'participant@example.test', entries, entryCount: entries.length })
}
