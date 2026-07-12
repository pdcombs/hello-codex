import { ObjectId } from 'mongodb'

const FIXTURE_DATE = new Date('2026-07-01T12:00:00.000Z')

export const eventSetupIds = Object.freeze({
  hostAccountId: new ObjectId('000000000000000000000201'),
  participantAccountId: new ObjectId('000000000000000000000202'),
  eventId: new ObjectId('000000000000000000000203'),
  categoryId: new ObjectId('000000000000000000000204'),
  entryId: new ObjectId('000000000000000000000205'),
  registrationId: new ObjectId('000000000000000000000206'),
})

export function buildCategory(overrides = {}) {
  return {
    _id: eventSetupIds.categoryId,
    title: 'Test event participants',
    titleNormalized: 'test event participants',
    isDefault: true,
    createdAt: FIXTURE_DATE,
    updatedAt: FIXTURE_DATE,
    ...overrides,
  }
}

export function buildEntry(overrides = {}) {
  return {
    _id: eventSetupIds.entryId,
    categoryId: eventSetupIds.categoryId,
    title: 'Participant entry',
    createdByAccountId: eventSetupIds.hostAccountId,
    createdAt: FIXTURE_DATE,
    schemaVersion: 1,
    ...overrides,
  }
}

export function buildEvent(overrides = {}) {
  return {
    _id: eventSetupIds.eventId,
    ownerAccountId: eventSetupIds.hostAccountId,
    publicId: 'event-setup-test',
    title: 'Test event',
    description: 'Event setup fixture',
    location: 'Test venue',
    registrationPolicy: 'admin_managed',
    categories: [buildCategory()],
    schemaVersion: 2,
    createdAt: FIXTURE_DATE,
    updatedAt: FIXTURE_DATE,
    ...overrides,
  }
}

export function buildRegistration(overrides = {}) {
  return {
    _id: eventSetupIds.registrationId,
    eventId: eventSetupIds.eventId,
    accountId: eventSetupIds.participantAccountId,
    status: 'registered',
    registrationSource: 'host',
    registeredByAccountId: eventSetupIds.hostAccountId,
    entries: [buildEntry()],
    schemaVersion: 2,
    createdAt: FIXTURE_DATE,
    updatedAt: FIXTURE_DATE,
    ...overrides,
  }
}
