import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { encryptVotingCode, digestVotingCode } from '../../src/domain/voting-access-code.js'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createBallotSubmissionRepository } from '../../src/repositories/ballot-submission-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createEventVoterAccessRepository } from '../../src/repositories/event-voter-access-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createVotingAccessCodeRepository } from '../../src/repositories/voting-access-code-repository.js'
import { createEventVotingService } from '../../src/services/event-voting-service.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

const key = 'b'.repeat(64)
describe('voter access with real MongoDB', () => {
  let mongo; let service; let event; let codeId
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules, accessPolicy: 'code',
      codeRequiresCompletedAccount: false, unrestrictedRepeatPolicy: null,
      opensAt: new Date('2029-01-01'), closesAt: new Date('2031-01-01') } })
    await mongo.database.collection('events').insertOne(event)
    await mongo.database.collection('eventEntries').insertOne({ _id: votingTestIds.entryId, eventId: event._id,
      categoryId: votingTestIds.categoryId, ownerAccountId: votingTestIds.voterId, title: 'Entry',
      createdByAccountId: votingTestIds.hostId, status: 'active', archiveReason: null, archivedAt: null,
      archivedByAccountId: null, createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    codeId = new ObjectId(); const encrypted = encryptVotingCode({ code: 'abc123', key })
    await mongo.database.collection('votingAccessCodes').insertOne({ _id: codeId, eventId: event._id,
      codeDigest: digestVotingCode({ eventId: event._id, code: 'abc123', key }), ...encrypted, status: 'unused',
      batchId: new ObjectId(), claimedByAccountId: null, usedByBallotId: null, createdByAccountId: votingTestIds.hostId,
      createdAt: new Date('2029-01-01'), usedAt: null, revokedAt: null, updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    const transaction = async (operation) => { const session = mongo.client.startSession(); let result
      try { await session.withTransaction(async () => { result = await operation(session) }); return result }
      finally { await session.endSession() } }
    service = createEventVotingService({ eventRepository: createEventRepository(mongo.database),
      eventEntryRepository: createEventEntryRepository(mongo.database),
      ballotRepository: createBallotSubmissionRepository(mongo.database), accountRepository: createAccountRepository(mongo.database),
      voterAccessRepository: createEventVoterAccessRepository(mongo.database),
      accessCodeRepository: createVotingAccessCodeRepository(mongo.database),
      idempotencyRepository: createIdempotencyRepository(mongo.database), auditRepository: createAuditEventRepository(mongo.database),
      digestCode: (eventId, code) => digestVotingCode({ eventId, code, key }),
      digestBrowserMarker: (marker) => `digest:${marker}`, generateBrowserMarker: () => 'generated-marker', withTransaction: transaction,
      now: () => new Date('2030-01-01') })
  })
  afterAll(async () => mongo?.cleanup())

  it('creates provisional account/access atomically without participant registration', async () => {
    await service.submit({ eventId: String(event._id), expectedRulesVersion: 1, accessCode: 'abc123',
      provisionalVoter: { email: 'new-voter@example.test' }, categoryBallots: [{
        categoryId: String(votingTestIds.categoryId), entryIds: [String(votingTestIds.entryId)] }], idempotencyKey: 'code-ballot' }, null)
    const account = await mongo.database.collection('accounts').findOne({ emailNormalized: 'new-voter@example.test' })
    expect(account).toMatchObject({ lifecycleStatus: 'provisional', referredByAccountId: null })
    expect(await mongo.database.collection('eventVoterAccess').findOne({ eventId: event._id, accountId: account._id }))
      .toMatchObject({ source: 'code', status: 'active', codeId })
    expect(await mongo.database.collection('eventRegistrations').countDocuments({ eventId: event._id })).toBe(0)

    const rollbackCodeId = new ObjectId(); const rollbackEncrypted = encryptVotingCode({ code: 'def456', key })
    await mongo.database.collection('votingAccessCodes').insertOne({ _id: rollbackCodeId, eventId: event._id,
      codeDigest: digestVotingCode({ eventId: event._id, code: 'def456', key }), ...rollbackEncrypted, status: 'unused',
      batchId: new ObjectId(), claimedByAccountId: null, usedByBallotId: null, createdByAccountId: votingTestIds.hostId,
      createdAt: new Date('2029-01-01'), usedAt: null, revokedAt: null, updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    await expect(service.submit({ eventId: String(event._id), expectedRulesVersion: 1, accessCode: 'def456',
      provisionalVoter: { email: 'rollback-voter@example.test' }, categoryBallots: [],
      idempotencyKey: 'rollback-code-ballot' }, null)).rejects.toMatchObject({ code: 'INVALID_BALLOT' })
    expect(await mongo.database.collection('accounts').findOne({ emailNormalized: 'rollback-voter@example.test' })).toBeNull()
    expect(await mongo.database.collection('votingAccessCodes').findOne({ _id: rollbackCodeId })).toMatchObject({ status: 'unused' })
  })

  it('enforces browser marker uniqueness for browser-limited unrestricted voting', async () => {
    const browserEventId = new ObjectId(); const browserEntryId = new ObjectId()
    const browserEvent = votingEventFixture({ _id: browserEventId, publicId: 'browser-limited',
      votingRules: { ...votingEventFixture().votingRules, unrestrictedRepeatPolicy: 'browser_limited',
        opensAt: new Date('2029-01-01'), closesAt: new Date('2031-01-01') } })
    await mongo.database.collection('events').insertOne(browserEvent)
    await mongo.database.collection('eventEntries').insertOne({ _id: browserEntryId, eventId: browserEventId,
      categoryId: votingTestIds.categoryId, ownerAccountId: votingTestIds.voterId, title: 'Browser entry',
      createdByAccountId: votingTestIds.hostId, status: 'active', archiveReason: null, archivedAt: null,
      archivedByAccountId: null, createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    const input = { eventId: String(browserEventId), expectedRulesVersion: 1, browserMarker: 'browser-one',
      categoryBallots: [{ categoryId: String(votingTestIds.categoryId), entryIds: [String(browserEntryId)] }] }
    await service.submit({ ...input, idempotencyKey: 'browser-1' }, null)
    await expect(service.submit({ ...input, idempotencyKey: 'browser-2' }, null)).rejects.toMatchObject({
      code: 'BALLOT_LIMIT_REACHED' })
  })

  it('enforces completed account fields and account ballot limit', async () => {
    const accountId = new ObjectId(); const accountEventId = new ObjectId(); const accountEntryId = new ObjectId()
    const account = { _id: accountId, displayName: 'Account Voter', emailNormalized: 'account-voter@example.test',
      phoneNormalized: '+14795550109', referredByAccountId: null, lifecycleStatus: 'completed', passwordHash: 'hash',
      verificationStatus: 'verified', verifiedAt: new Date('2029-01-01'), credentialVersion: 0,
      createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 2 }
    await mongo.database.collection('accounts').insertOne(account)
    const accountEvent = votingEventFixture({ _id: accountEventId, publicId: 'account-limited',
      votingRules: { ...votingEventFixture().votingRules, accessPolicy: 'account', unrestrictedRepeatPolicy: null,
        maxBallotsPerAccount: 1, opensAt: new Date('2029-01-01'), closesAt: new Date('2031-01-01') } })
    await mongo.database.collection('events').insertOne(accountEvent)
    await mongo.database.collection('eventEntries').insertOne({ _id: accountEntryId, eventId: accountEventId,
      categoryId: votingTestIds.categoryId, ownerAccountId: votingTestIds.voterId, title: 'Account entry',
      createdByAccountId: votingTestIds.hostId, status: 'active', archiveReason: null, archivedAt: null,
      archivedByAccountId: null, createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    const input = { eventId: String(accountEventId), expectedRulesVersion: 1,
      categoryBallots: [{ categoryId: String(votingTestIds.categoryId), entryIds: [String(accountEntryId)] }] }
    await service.submit({ ...input, idempotencyKey: 'account-1' }, { account })
    await expect(service.submit({ ...input, idempotencyKey: 'account-2' }, { account })).rejects.toMatchObject({
      code: 'BALLOT_LIMIT_REACHED' })
  })
})
