import { ObjectId } from 'mongodb'

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

export function toEventRegistrationView(registration, account) {
  return Object.freeze({
    id: String(registration._id),
    accountId: String(registration.accountId),
    email: account?.emailNormalized ?? null,
    phone: account?.phoneNormalized ?? null,
    accountCompleted: account?.lifecycleStatus === 'completed',
    status: registration.status === 'registered' ? 'REGISTERED' : 'REMOVED',
    source: registration.registrationSource === 'self' ? 'SELF' : 'HOST',
    createdAt: registration.createdAt,
  })
}
