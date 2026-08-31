import { createAuditEventRepository } from '../repositories/audit-event-repository.js'

const MIGRATION = '008-reconcile-voting-code-ballots'

export async function runVotingCodeBallotReconciliation({ database, logger = null, now = new Date() }) {
  const codes = database.collection('votingAccessCodes')
  const ballots = database.collection('ballotSubmissions')
  const audit = createAuditEventRepository(database)
  let linked = 0; let restored = 0

  for await (const code of codes.find({ status: 'used', usedByBallotId: null })) {
    const ballot = await ballots.findOne({ accessCodeId: code._id }, { projection: { _id: 1, accountId: 1, submittedAt: 1 } })
    const correlationId = `migration:${MIGRATION}:${code._id}`
    if (ballot) {
      const result = await codes.updateOne({ _id: code._id, status: 'used', usedByBallotId: null }, {
        $set: { usedByBallotId: ballot._id, claimedByAccountId: ballot.accountId ?? code.claimedByAccountId,
          usedAt: code.usedAt ?? ballot.submittedAt ?? now, updatedAt: now },
      })
      if (!result.modifiedCount) continue
      linked += 1
      await audit.append({ name: 'voting.code_reconciled', subjectType: 'votingAccessCode', subjectId: code._id,
        outcome: 'success', correlationId, metadata: { reasonCode: 'BALLOT_LINK_RESTORED' } })
    } else {
      const result = await codes.updateOne({ _id: code._id, status: 'used', usedByBallotId: null }, {
        $set: { status: 'unused', claimedByAccountId: null, usedAt: null, updatedAt: now },
      })
      if (!result.modifiedCount) continue
      restored += 1
      await audit.append({ name: 'voting.code_reconciled', subjectType: 'votingAccessCode', subjectId: code._id,
        outcome: 'success', correlationId, metadata: { reasonCode: 'ORPHANED_CLAIM_RESTORED' } })
    }
  }
  const outcome = Object.freeze({ linked, restored })
  logger?.info({ event: 'migration.completed', migration: MIGRATION, ...outcome }, 'Migration completed')
  return outcome
}
