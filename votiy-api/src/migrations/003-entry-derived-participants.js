import { ObjectId } from 'mongodb'
import { createEventEntryDocument } from '../domain/event-entry.js'

const MIGRATION = '003-entry-derived-participants'
export const SYSTEM_MIGRATION_ACTOR_ID = new ObjectId('000000000000000000000003')

export async function runEntryDerivedParticipantMigration({ database, logger = null, now = new Date() }) {
  const registrations = database.collection('eventRegistrations')
  const entries = database.collection('eventEntries')
  const events = database.collection('events')
  const accounts = database.collection('accounts')
  const checkpoints = database.collection('migrationCheckpoints')
  const outcome = { processed: 0, inserted: 0, existing: 0, active: 0, archived: 0, invalid: 0 }

  for await (const registration of registrations.find({}).sort({ _id: 1 })) {
    const event = await events.findOne({ _id: registration.eventId })
    const account = await accounts.findOne({ _id: registration.accountId })
    if (!event || !account) {
      outcome.invalid += registration.entries?.length ?? 0
      throw new Error('Migration 003 found an invalid event or account reference')
    }
    const categoryIds = new Set((event.categories ?? []).map(({ _id }) => String(_id)))
    for (const embedded of registration.entries ?? []) {
      outcome.processed += 1
      if (!categoryIds.has(String(embedded.categoryId))) {
        outcome.invalid += 1
        throw new Error('Migration 003 found an invalid category reference')
      }
      const archived = registration.status === 'removed'
      const archivedAt = archived ? registration.removedAt ?? now : null
      const document = createEventEntryDocument({
        id: embedded._id, eventId: registration.eventId, categoryId: embedded.categoryId,
        ownerAccountId: registration.accountId, title: embedded.title,
        createdByAccountId: embedded.createdByAccountId, now: embedded.createdAt,
        status: archived ? 'archived' : 'active',
        archiveReason: archived ? 'legacy_registration_removed' : null,
        archivedAt,
        archivedByAccountId: archived ? SYSTEM_MIGRATION_ACTOR_ID : null,
      })
      const result = await entries.updateOne({ _id: document._id }, { $setOnInsert: document }, { upsert: true })
      if (result.upsertedCount) outcome.inserted += 1
      else {
        const existing = await entries.findOne({ _id: document._id })
        if (!sameEntry(existing, document)) throw new Error('Migration 003 found an entry content mismatch')
        outcome.existing += 1
      }
      outcome[archived ? 'archived' : 'active'] += 1
    }
    await checkpoints.updateOne(
      { migration: MIGRATION, stage: 'entries' },
      { $set: { lastRegistrationId: registration._id, ...outcome, completedAt: now },
        $setOnInsert: { _id: new ObjectId() } },
      { upsert: true },
    )
  }
  logger?.info({ event: 'migration.completed', migration: MIGRATION, ...outcome }, 'Migration completed')
  return Object.freeze(outcome)
}

function sameEntry(left, right) {
  return left && ['eventId', 'categoryId', 'ownerAccountId', 'createdByAccountId'].every((key) => String(left[key]) === String(right[key]))
    && left.title === right.title && left.status === right.status
}
