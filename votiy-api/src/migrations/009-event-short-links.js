import { normalizeShortId } from '../domain/event-short-link.js'

const MIGRATION = '009-event-short-links'

export async function runEventShortLinkMigration({ database, logger = null }) {
  const events = database.collection('events'); let migrated = 0
  for await (const event of events.find({ shortIdNormalized: { $exists: false } })) {
    const shortId = event.shortId ?? event.publicId
    const result = await events.updateOne({ _id: event._id, shortIdNormalized: { $exists: false } },
      { $set: { shortId, shortIdNormalized: normalizeShortId(shortId) } })
    migrated += result.modifiedCount
  }
  logger?.info({ event: 'migration.completed', migration: MIGRATION, migrated }, 'Migration completed')
  return Object.freeze({ migrated })
}
