const MIGRATION = '005-event-voting-rules'

export function draftVotingRules(event, now = event.updatedAt ?? event.createdAt ?? new Date()) {
  return {
    status: 'draft', version: 1, opensAt: null, closesAt: null,
    accessPolicy: 'unrestricted', unrestrictedRepeatPolicy: 'unlimited',
    maxBallotsPerAccount: null, codeRequiresCompletedAccount: null,
    defaultCategoryMethod: 'single', defaultMultipleMin: null, defaultMultipleMax: null,
    categoryOverrides: [], updatedByAccountId: event.ownerAccountId,
    createdAt: now, updatedAt: now,
  }
}

export async function runEventVotingRulesMigration({ database, logger = null }) {
  const events = database.collection('events')
  let migrated = 0
  for await (const event of events.find({ $or: [{ schemaVersion: { $lt: 3 } }, { votingRules: { $exists: false } }] })) {
    const update = { schemaVersion: 3, votingRules: event.votingRules ?? draftVotingRules(event) }
    const result = await events.updateOne({ _id: event._id }, { $set: update })
    migrated += result.modifiedCount
  }
  logger?.info({ event: 'migration.completed', migration: MIGRATION, migrated }, 'Migration completed')
  return Object.freeze({ migrated })
}
