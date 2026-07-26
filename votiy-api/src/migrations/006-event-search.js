import { createEventSearchProjection } from '../domain/event-search.js'

export async function runEventSearchMigration({ database, logger, batchSize = 100 }) {
  const events = database.collection('events')
  let migrated = 0
  while (true) {
    const rows = await events.find({ schemaVersion: { $lt: 4 } }).sort({ _id: 1 }).limit(batchSize).toArray()
    if (!rows.length) break
    for (const event of rows) {
      await events.updateOne({ _id: event._id, schemaVersion: event.schemaVersion }, { $set: {
        visibility: event.visibility ?? 'public',
        lifecycleStatus: event.lifecycleStatus ?? 'active',
        archivedAt: event.archivedAt ?? null,
        ...createEventSearchProjection(event),
        schemaVersion: 4,
      } })
      migrated += 1
    }
  }
  logger?.info({ operation: 'event.search_migration', outcome: 'success', migrated }, 'Event search migration complete')
  return { migrated }
}
