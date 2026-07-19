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
    generated = await service.generateCodes({ eventId: String(event._id), quantity: 2, idempotencyKey: 'batch-1' },
      { account: { _id: votingTestIds.hostId } }, { correlationId: 'generate-1' })
  })
  afterAll(async () => mongo?.cleanup())

  it('generates exact encrypted host-only inventory with idempotent replay', async () => {
    expect(generated).toHaveLength(2)
    expect(new Set(generated.map(({ code }) => code)).size).toBe(2)
    expect(await service.generateCodes({ eventId: String(event._id), quantity: 2, idempotencyKey: 'batch-1' },
      { account: { _id: votingTestIds.hostId } })).toHaveLength(2)
    const inventory = await service.listCodes({ eventId: String(event._id), first: 1 },
      { account: { _id: votingTestIds.hostId } })
    expect(inventory.nodes).toHaveLength(1); expect(inventory.nextCursor).toBeTruthy()
    await expect(service.listCodes({ eventId: String(event._id) }, { account: { _id: votingTestIds.voterId } }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
    const stored = await mongo.database.collection('votingAccessCodes').findOne({ _id: new ObjectId(generated[0].id) })
    expect(JSON.stringify(stored)).not.toContain(generated[0].code)
  })

  it('allows exactly one concurrent claim and rolls back code when audit fails', async () => {
    const ballot = (code, email, keySuffix) => service.submit({ eventId: String(event._id), expectedRulesVersion: 1,
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
    await expect(failing.submit({ eventId: String(event._id), expectedRulesVersion: 1, accessCode: generated[1].code,
      provisionalVoter: { email: 'rollback-code@example.test' }, categoryBallots: [{ categoryId: String(votingTestIds.categoryId),
        entryIds: [String(votingTestIds.entryId)] }], idempotencyKey: 'claim-rollback' }, null))
      .rejects.toThrow('AUDIT_FAILURE')
    expect(await mongo.database.collection('votingAccessCodes').findOne({ _id: new ObjectId(generated[1].id) }))
      .toMatchObject({ status: 'unused' })
    const logs = JSON.stringify(logger.info.mock.calls)
    expect(logs).not.toContain(generated[0].code); expect(logs).not.toContain('race-one@example.test')
    expect(logs).toContain('voting.code_generate'); expect(logs).toContain('voting.code_consume')
  })
})
