import { ObjectId } from 'mongodb'
import { createCategory } from '../domain/event-category.js'
import { createEntry } from '../domain/event-entry.js'
import { deriveDisplayName } from '../domain/account.js'

const MIGRATION = '002-event-categories-entries'

export async function runEventSetupMigration({ database, logger = null, now = new Date() }) {
  const accounts = database.collection('accounts')
  const events = database.collection('events')
  const registrations = database.collection('eventRegistrations')
  const checkpoints = database.collection('migrationCheckpoints')
  const outcome = { accounts: 0, events: 0, registrations: 0 }

  const allAccounts = await accounts.find({}).sort({ _id: 1 }).toArray()
  let phoneOnlyPosition = 0
  for (const account of allAccounts) {
    if (!account.emailNormalized) phoneOnlyPosition += 1
    if (account.schemaVersion !== 1) continue
    const displayName = deriveDisplayName({
      emailNormalized: account.emailNormalized,
      phoneOnlyPosition: account.emailNormalized ? null : phoneOnlyPosition,
    })
    const result = await accounts.updateOne(
      { _id: account._id, schemaVersion: 1 },
      { $set: { displayName, schemaVersion: 2, updatedAt: now } },
    )
    outcome.accounts += result.modifiedCount
  }
  await checkpoint(checkpoints, 'accounts', outcome.accounts, now)
  logStage(logger, 'accounts', outcome.accounts)

  const legacyEvents = await events.find({ schemaVersion: 1 }).sort({ _id: 1 }).toArray()
  for (const event of legacyEvents) {
    const category = createCategory({ title: `${event.title.trim()} participants`, isDefault: true, now })
    const result = await events.updateOne(
      { _id: event._id, schemaVersion: 1 },
      { $set: { categories: [category], schemaVersion: 2, updatedAt: now } },
    )
    outcome.events += result.modifiedCount
  }
  await checkpoint(checkpoints, 'events', outcome.events, now)
  logStage(logger, 'events', outcome.events)

  const allRegistrations = await registrations
    .find({})
    .sort({ eventId: 1, createdAt: 1, _id: 1 })
    .toArray()
  const positions = new Map()
  for (const registration of allRegistrations) {
    const key = String(registration.eventId)
    const position = (positions.get(key) ?? 0) + 1
    positions.set(key, position)
    if (registration.schemaVersion !== 1) continue
    const event = await events.findOne({ _id: registration.eventId, schemaVersion: 2 })
    if (!event) throw new Error(`Migration event missing: ${registration.eventId}`)
    const entry = createEntry({
      categoryId: event.categories.find(({ isDefault }) => isDefault)._id,
      title: `Entry ${position}`,
      createdByAccountId: registration.registeredByAccountId,
      now,
    })
    const result = await registrations.updateOne(
      { _id: registration._id, schemaVersion: 1 },
      { $set: { entries: [entry], schemaVersion: 2, updatedAt: now } },
    )
    outcome.registrations += result.modifiedCount
  }
  await checkpoint(checkpoints, 'registrations', outcome.registrations, now)
  logStage(logger, 'registrations', outcome.registrations)
  logger?.info({ event: 'migration.completed', migration: MIGRATION, ...outcome }, 'Migration completed')
  return Object.freeze(outcome)
}

function logStage(logger, stage, migrated) {
  logger?.info({ event: 'migration.stage.completed', migration: MIGRATION, stage, migrated }, 'Migration stage completed')
}

async function checkpoint(collection, stage, migrated, now) {
  await collection.updateOne(
    { migration: MIGRATION, stage },
    { $set: { migrated, completedAt: now }, $setOnInsert: { _id: new ObjectId() } },
    { upsert: true },
  )
}
