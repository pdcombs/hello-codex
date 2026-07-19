const MIGRATION = '004-category-archival'

export async function runCategoryArchivalMigration({ database, logger = null }) {
  const events = database.collection('events')
  let migrated = 0
  for await (const event of events.find({ categories: { $exists: true } })) {
    const categories = (event.categories ?? []).map((category) => ({
      ...category,
      status: category.status ?? 'active',
      archiveReason: category.archiveReason ?? null,
      archivedAt: category.archivedAt ?? null,
      archivedByAccountId: category.archivedByAccountId ?? null,
    }))
    if (JSON.stringify(categories) === JSON.stringify(event.categories ?? [])) continue
    const result = await events.updateOne({ _id: event._id }, { $set: { categories } })
    migrated += result.modifiedCount
  }
  logger?.info({ event: 'migration.completed', migration: MIGRATION, migrated }, 'Migration completed')
  return Object.freeze({ migrated })
}
