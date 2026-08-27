import { createClosedVotingState } from '../domain/event-voting-state.js'

const MIGRATION = '007-manual-voting-state'

export async function runManualVotingStateMigration({ database, logger = null }) {
  const events = database.collection('events'); let migrated = 0
  for await (const event of events.find({ $or: [{ schemaVersion: { $lt: 5 } }, { votingState: { $exists: false } }] })) {
    const votingState = event.votingState ?? createClosedVotingState({ ownerAccountId: event.ownerAccountId,
      now: event.updatedAt ?? event.createdAt ?? new Date() })
    const result = await events.updateOne({ _id: event._id }, { $set: { votingState, schemaVersion: 5 } })
    migrated += result.modifiedCount
  }
  logger?.info({ event: 'migration.completed', migration: MIGRATION, migrated }, 'Migration completed')
  return Object.freeze({ migrated })
}
