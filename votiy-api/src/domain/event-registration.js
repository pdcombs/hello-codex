import { ObjectId } from 'mongodb'
import { createEntry } from './event-entry.js'

const STATUSES = new Set(['registered', 'removed'])
const SOURCES = new Set(['self', 'host'])

export function createEventRegistrationDocument({
  eventId,
  accountId,
  registrationSource,
  registeredByAccountId,
  now = new Date(),
}) {
  if (!STATUSES.has('registered') || !SOURCES.has(registrationSource)) throw new TypeError('Invalid event registration')
  return Object.freeze({
    _id: new ObjectId(),
    eventId: eventId instanceof ObjectId ? eventId : new ObjectId(eventId),
    accountId: accountId instanceof ObjectId ? accountId : new ObjectId(accountId),
    status: 'registered',
    registrationSource,
    registeredByAccountId:
      registeredByAccountId instanceof ObjectId ? registeredByAccountId : new ObjectId(registeredByAccountId),
    removedAt: null,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  })
}

export function withRegistrationVersion2(registration, { categoryId, title, now = registration.updatedAt ?? new Date() }) {
  const entry = createEntry({
    categoryId, title, createdByAccountId: registration.registeredByAccountId, now,
  })
  return Object.freeze({ ...registration, entries: [entry], schemaVersion: 2, updatedAt: now })
}

export function toEventRegistrationView(registration, account) {
  return Object.freeze({
    id: String(registration._id),
    accountId: String(registration.accountId),
    email: account?.emailNormalized ?? null,
    phone: account?.phoneNormalized ?? null,
    displayName: account?.displayName ?? null,
    entryCount: registration.entries?.length ?? 0,
    entries: registration.entries ?? [],
    accountCompleted: account?.lifecycleStatus === 'completed',
    status: registration.status === 'registered' ? 'REGISTERED' : 'REMOVED',
    source: registration.registrationSource === 'self' ? 'SELF' : 'HOST',
    createdAt: registration.createdAt,
  })
}
