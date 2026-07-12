import { ObjectId } from 'mongodb'

export function createEntry({ title, categoryId, createdByAccountId, now = new Date(), id = new ObjectId() }) {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  if (!trimmed || trimmed.length > 160) throw new TypeError('Invalid entry title')
  if (!categoryId || !createdByAccountId) throw new TypeError('Entry category and creator are required')
  return Object.freeze({
    _id: id instanceof ObjectId ? id : new ObjectId(id),
    categoryId: categoryId instanceof ObjectId ? categoryId : new ObjectId(categoryId),
    title: trimmed,
    createdByAccountId: createdByAccountId instanceof ObjectId
      ? createdByAccountId
      : new ObjectId(createdByAccountId),
    createdAt: now,
    schemaVersion: 1,
  })
}

export function toEntryView(entry, owner) {
  return Object.freeze({
    id: String(entry._id), title: entry.title, categoryId: String(entry.categoryId),
    ownerAccountId: String(owner._id ?? owner.id), ownerDisplayName: owner.displayName,
    status: entry.status === 'archived' ? 'ARCHIVED' : 'ACTIVE',
    createdAt: entry.createdAt,
  })
}

export const ENTRY_ARCHIVE_REASONS = Object.freeze([
  'entry_removed',
  'participant_removed',
  'legacy_registration_removed',
])

export function createEventEntryDocument({
  eventId,
  categoryId,
  ownerAccountId,
  title,
  createdByAccountId,
  now = new Date(),
  id = new ObjectId(),
  status = 'active',
  archiveReason = null,
  archivedAt = null,
  archivedByAccountId = null,
}) {
  const embedded = createEntry({ title, categoryId, createdByAccountId, now, id })
  if (!eventId || !ownerAccountId) throw new TypeError('Entry event and owner are required')
  if (!['active', 'archived'].includes(status)) throw new TypeError('Invalid entry status')
  const isArchived = status === 'archived'
  if (isArchived !== Boolean(archiveReason && archivedAt && archivedByAccountId)) {
    throw new TypeError('Entry archive metadata must match status')
  }
  if (archiveReason && !ENTRY_ARCHIVE_REASONS.includes(archiveReason)) throw new TypeError('Invalid archive reason')
  return Object.freeze({
    ...embedded,
    eventId: eventId instanceof ObjectId ? eventId : new ObjectId(eventId),
    ownerAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId),
    status,
    archiveReason,
    archivedAt,
    archivedByAccountId: archivedByAccountId
      ? archivedByAccountId instanceof ObjectId ? archivedByAccountId : new ObjectId(archivedByAccountId)
      : null,
    updatedAt: isArchived ? archivedAt : now,
  })
}

export function toParticipantCard(entries, account) {
  if (!account || entries.length === 0) throw new TypeError('Participant card requires account and entries')
  const activeEntries = entries.filter(({ status }) => status === 'active')
  if (activeEntries.length === 0) throw new TypeError('Participant card requires active entries')
  return Object.freeze({
    accountId: String(account._id),
    displayName: account.displayName,
    email: account.emailNormalized ?? null,
    entries: activeEntries.map((entry) => toEntryView(entry, account)),
    entryCount: activeEntries.length,
  })
}
