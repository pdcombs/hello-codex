import { ObjectId } from 'mongodb'

export const votingTestIds = Object.freeze({
  hostId: new ObjectId('64b000000000000000000001'),
  voterId: new ObjectId('64b000000000000000000002'),
  eventId: new ObjectId('64b000000000000000000003'),
  categoryId: new ObjectId('64b000000000000000000004'),
  entryId: new ObjectId('64b000000000000000000005'),
})

export function votingRulesFixture(overrides = {}) {
  return {
    status: 'configured',
    version: 1,
    opensAt: new Date('2030-01-01T12:00:00.000Z'),
    closesAt: new Date('2030-01-01T14:00:00.000Z'),
    accessPolicy: 'unrestricted',
    unrestrictedRepeatPolicy: 'unlimited',
    maxBallotsPerAccount: null,
    codeRequiresCompletedAccount: null,
    defaultCategoryMethod: 'single',
    defaultMultipleMin: null,
    defaultMultipleMax: null,
    categoryOverrides: [],
    updatedByAccountId: votingTestIds.hostId,
    createdAt: new Date('2030-01-01T10:00:00.000Z'),
    updatedAt: new Date('2030-01-01T10:00:00.000Z'),
    ...overrides,
  }
}

export function votingEventFixture(overrides = {}) {
  return {
    _id: votingTestIds.eventId,
    ownerAccountId: votingTestIds.hostId,
    publicId: 'voting-event-fixture',
    title: 'Voting event',
    description: null,
    location: null,
    registrationPolicy: 'admin_managed',
    categories: [{
      _id: votingTestIds.categoryId,
      title: 'Category',
      titleNormalized: 'category',
      isDefault: true,
      status: 'active',
      archiveReason: null,
      archivedAt: null,
      archivedByAccountId: null,
      createdAt: new Date('2030-01-01T10:00:00.000Z'),
      updatedAt: new Date('2030-01-01T10:00:00.000Z'),
    }],
    votingRules: votingRulesFixture(),
    createdAt: new Date('2030-01-01T10:00:00.000Z'),
    updatedAt: new Date('2030-01-01T10:00:00.000Z'),
    schemaVersion: 3,
    ...overrides,
  }
}

export function votingCodeFixture(overrides = {}) {
  return {
    _id: new ObjectId(),
    eventId: votingTestIds.eventId,
    status: 'unused',
    batchId: new ObjectId(),
    claimedByAccountId: null,
    usedByBallotId: null,
    usedAt: null,
    revokedAt: null,
    createdByAccountId: votingTestIds.hostId,
    createdAt: new Date('2030-01-01T10:00:00.000Z'),
    updatedAt: new Date('2030-01-01T10:00:00.000Z'),
    schemaVersion: 1,
    ...overrides,
  }
}
