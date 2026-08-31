import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { digestVotingCode } from '../../src/domain/voting-access-code.js'
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

const key = 'd'.repeat(64)
describe('voting code generation and atomic claim', () => {
  let mongo; let service; let event; let generated; let logger
  const transaction = async (operation) => { const session = mongo.client.startSession(); let result
    try { await session.withTransaction(async () => { result = await operation(session) }); return result }
    finally { await session.endSession() } }
  function buildService(auditRepository = createAuditEventRepository(mongo.database)) {
    return createEventVotingService({ eventRepository: createEventRepository(mongo.database),
      eventEntryRepository: createEventEntryRepository(mongo.database),
      ballotRepository: createBallotSubmissionRepository(mongo.database), accountRepository: createAccountRepository(mongo.database),
      voterAccessRepository: createEventVoterAccessRepository(mongo.database),
      accessCodeRepository: createVotingAccessCodeRepository(mongo.database),
      idempotencyRepository: createIdempotencyRepository(mongo.database), auditRepository,
      digestCode: (eventId, code) => digestVotingCode({ eventId, code, key }), votingCodeEncryptionKey: key,
      digestBrowserMarker: (marker) => `browser:${marker}`, generateBrowserMarker: () => 'generated-browser',
      withTransaction: transaction, now: () => new Date('2030-01-01'), logger })
  }
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database); logger = { info: vi.fn(), warn: vi.fn() }
    event = votingEventFixture({ votingRules: { ...votingEventFixture().votingRules, accessPolicy: 'code',
      codeRequiresCompletedAccount: false, unrestrictedRepeatPolicy: null,
      opensAt: new Date('2029-01-01'), closesAt: new Date('2031-01-01') } })
    await mongo.database.collection('events').insertOne(event)
    await mongo.database.collection('eventEntries').insertOne({ _id: votingTestIds.entryId, eventId: event._id,
      categoryId: votingTestIds.categoryId, ownerAccountId: votingTestIds.voterId, title: 'Entry',
      createdByAccountId: votingTestIds.hostId, status: 'active', archiveReason: null, archivedAt: null,
      archivedByAccountId: null, createdAt: new Date('2029-01-01'), updatedAt: new Date('2029-01-01'), schemaVersion: 1 })
    service = buildService()
    generated = await service.generateCodes({ eventId: String(event._id), quantity: 4, idempotencyKey: 'batch-1' },
      { account: { _id: votingTestIds.hostId } }, { correlationId: 'generate-1' })
  })
  afterAll(async () => mongo?.cleanup())

  it('generates exact encrypted host-only inventory with idempotent replay', async () => {
    expect(generated).toHaveLength(4)
    expect(new Set(generated.map(({ code }) => code)).size).toBe(4)
    expect(await service.generateCodes({ eventId: String(event._id), quantity: 4, idempotencyKey: 'batch-1' },
      { account: { _id: votingTestIds.hostId } })).toHaveLength(4)
    const inventory = await service.listCodes({ eventId: String(event._id), first: 1 },
      { account: { _id: votingTestIds.hostId } })
    expect(inventory.nodes).toHaveLength(1); expect(inventory.nextCursor).toBeTruthy()
    await expect(service.listCodes({ eventId: String(event._id) }, { account: { _id: votingTestIds.voterId } }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
    const stored = await mongo.database.collection('votingAccessCodes').findOne({ _id: new ObjectId(generated[0].id) })
    expect(JSON.stringify(stored)).not.toContain(generated[0].code)
  })

  it('allows exactly one concurrent claim and rolls back code when audit fails', async () => {
    const ballot = (code, email, keySuffix) => service.submit({ eventId: String(event._id), expectedRulesVersion: 1, expectedVotingStateVersion: 1,
      accessCode: code, provisionalVoter: { email }, categoryBallots: [{ categoryId: String(votingTestIds.categoryId),
        entryIds: [String(votingTestIds.entryId)] }], idempotencyKey: `claim-${keySuffix}` }, null,
    { correlationId: `claim-${keySuffix}` })
    const outcomes = await Promise.allSettled([
      ballot(generated[0].code, 'race-one@example.test', 'one'),
      ballot(generated[0].code, 'race-two@example.test', 'two'),
    ])
    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(await mongo.database.collection('ballotSubmissions').countDocuments({ accessCodeId: { $ne: null } })).toBe(1)
    const usedInventory = await service.listCodes({ eventId: String(event._id), first: 10 },
      { account: { _id: votingTestIds.hostId } })
    const usedCode = usedInventory.nodes.find(({ id }) => id === generated[0].id)
    expect(usedCode).toMatchObject({ status: 'USED' })
    expect(usedCode.claimantEmail).toMatch(/^race-(one|two)@example\.test$/)
    const failing = buildService({ append: async () => { throw new Error('AUDIT_FAILURE') } })
    await expect(failing.submit({ eventId: String(event._id), expectedRulesVersion: 1, expectedVotingStateVersion: 1, accessCode: generated[1].code,
      provisionalVoter: { email: 'rollback-code@example.test' }, categoryBallots: [{ categoryId: String(votingTestIds.categoryId),
        entryIds: [String(votingTestIds.entryId)] }], idempotencyKey: 'claim-rollback' }, null))
      .rejects.toThrow('AUDIT_FAILURE')
    expect(await mongo.database.collection('votingAccessCodes').findOne({ _id: new ObjectId(generated[1].id) }))
      .toMatchObject({ status: 'unused' })
    const logs = JSON.stringify(logger.info.mock.calls)
    expect(logs).not.toContain(generated[0].code); expect(logs).not.toContain('race-one@example.test')
    expect(logs).toContain('voting.code_generate'); expect(logs).toContain('voting.code_consume')
  })

  it('requires and links a different code for another ballot on the same browser', async () => {
    const marker = 'shared-browser'; const input = (keySuffix) => ({ eventId: String(event._id),
      expectedRulesVersion: 1, expectedVotingStateVersion: 1, browserMarker: marker,
      categoryBallots: [{ categoryId: String(votingTestIds.categoryId), entryIds: [String(votingTestIds.entryId)] }],
      idempotencyKey: `shared-${keySuffix}` })
    expect((await service.requestAccess({ eventId: String(event._id), accessCode: generated[2].code }, null,
      { browserMarker: marker, correlationId: 'shared-code-a' })).access.allowed).toBe(true)
    const first = await service.submit(input('a'), null, { correlationId: 'shared-ballot-a' })
    const replay = await service.submit(input('a'), null, { correlationId: 'shared-ballot-a-retry' })
    expect(replay.receipt.id).toBe(first.receipt.id)
    expect((await service.requestAccess({ eventId: String(event._id) }, null,
      { browserMarker: marker, correlationId: 'shared-repeat' })).access.decision).toBe('CODE_REQUIRED')
    expect((await service.requestAccess({ eventId: String(event._id), accessCode: generated[2].code }, null,
      { browserMarker: marker, correlationId: 'shared-old-code' })).access.decision).toBe('CODE_REQUIRED')
    expect((await service.requestAccess({ eventId: String(event._id), accessCode: generated[3].code }, null,
      { browserMarker: marker, correlationId: 'shared-code-b' })).access.allowed).toBe(true)
    const second = await service.submit(input('b'), null, { correlationId: 'shared-ballot-b' })
    expect(second.receipt.id).not.toBe(first.receipt.id)
    const review = await service.ballotView({ publicId: event.publicId }, null, { browserMarker: marker })
    expect(review.submittedBallot.id).toBe(second.receipt.id); expect(review.mayCastAnother).toBe(true)
    const ballots = await mongo.database.collection('ballotSubmissions').find({ browserMarkerDigest: `browser:${marker}` })
      .sort({ submittedAt: 1, _id: 1 }).toArray()
    expect(ballots).toHaveLength(2); expect(String(ballots[0].accessCodeId)).not.toBe(String(ballots[1].accessCodeId))
    const codes = await mongo.database.collection('votingAccessCodes').find({ _id: { $in: ballots.map(({ accessCodeId }) => accessCodeId) } }).toArray()
    expect(codes.every(({ usedByBallotId }) => usedByBallotId)).toBe(true)
    const integrityAudits = await mongo.database.collection('auditEvents').find({ name: {
      $in: ['voting.code_reuse_denied', 'voting.code_ballot_attached'] } }).toArray()
    expect(integrityAudits.some(({ name }) => name === 'voting.code_reuse_denied')).toBe(true)
    expect(integrityAudits.filter(({ name }) => name === 'voting.code_ballot_attached')).toHaveLength(2)
    expect(JSON.stringify(integrityAudits)).not.toContain(generated[2].code)
    expect(JSON.stringify(integrityAudits)).not.toContain(marker)
  })
})
