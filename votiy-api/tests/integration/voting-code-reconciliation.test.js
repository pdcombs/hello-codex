import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runVotingCodeBallotReconciliation } from '../../src/migrations/008-reconcile-voting-code-ballots.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('voting code ballot reconciliation', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('links ballot-backed codes, restores orphaned claims, and is idempotent', async () => {
    const eventId = new ObjectId(); const creatorId = new ObjectId(); const linkedCodeId = new ObjectId()
    const orphanCodeId = new ObjectId(); const ballotId = new ObjectId(); const timestamp = new Date('2030-01-01')
    const code = (_id) => ({ _id, eventId, codeDigest: String(_id), codeCiphertext: 'ciphertext', codeIv: 'iv',
      codeAuthTag: 'tag', keyVersion: 1, status: 'used', batchId: new ObjectId(), claimedByAccountId: null,
      usedByBallotId: null, createdByAccountId: creatorId, createdAt: timestamp, usedAt: timestamp,
      revokedAt: null, updatedAt: timestamp, schemaVersion: 1 })
    await mongo.database.collection('votingAccessCodes').insertMany([code(linkedCodeId), code(orphanCodeId)])
    await mongo.database.collection('ballotSubmissions').insertOne({ _id: ballotId, eventId, accountId: null,
      accessCodeId: linkedCodeId, browserMarkerDigest: null, rulesVersion: 1, accessPolicy: 'code',
      categoryBallots: [], submittedAt: timestamp, createdAt: timestamp, schemaVersion: 1 })

    expect(await runVotingCodeBallotReconciliation({ database: mongo.database, now: timestamp }))
      .toEqual({ linked: 1, restored: 1 })
    expect(await mongo.database.collection('votingAccessCodes').findOne({ _id: linkedCodeId }))
      .toMatchObject({ status: 'used', usedByBallotId: ballotId })
    expect(await mongo.database.collection('votingAccessCodes').findOne({ _id: orphanCodeId }))
      .toMatchObject({ status: 'unused', usedByBallotId: null, usedAt: null, claimedByAccountId: null })
    expect(await mongo.database.collection('auditEvents').countDocuments({ name: 'voting.code_reconciled' })).toBe(2)
    expect(await runVotingCodeBallotReconciliation({ database: mongo.database, now: timestamp }))
      .toEqual({ linked: 0, restored: 0 })
  })
})
