import { ObjectId } from 'mongodb'
import { createEventEntryDocument } from '../domain/event-entry.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventEntryRepository(database) {
  const collection = database.collection('eventEntries')
  return Object.freeze({
    findById(entryId, options = {}) {
      return collection.findOne({ _id: id(entryId) }, options)
    },
    findByIds(entryIds, options = {}) {
      if (entryIds.length === 0) return []
      return collection.find({ _id: { $in: entryIds.map(id) } }, options).sort({ createdAt: 1, _id: 1 }).toArray()
    },
    listActiveByEvent(eventId, options = {}) {
      return collection.find({ eventId: id(eventId), status: 'active' }, options)
        .sort({ createdAt: 1, _id: 1 }).toArray()
    },
    listActiveByEventAndOwner(eventId, ownerAccountId, options = {}) {
      return collection.find({ eventId: id(eventId), ownerAccountId: id(ownerAccountId), status: 'active' }, options)
        .sort({ createdAt: 1, _id: 1 }).toArray()
    },
    async createMany({ eventId, ownerAccountId, createdByAccountId, entries, now }, options = {}) {
      const documents = entries.map((entry) => createEventEntryDocument({
        ...entry, eventId, ownerAccountId, createdByAccountId, now,
      }))
      if (documents.length > 0) await collection.insertMany(documents, options)
      return documents
    },
    archiveOne({ eventId, entryId, archivedByAccountId, archiveReason = 'entry_removed', now }, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(entryId), eventId: id(eventId), status: 'active' },
        { $set: { status: 'archived', archiveReason, archivedAt: now,
          archivedByAccountId: id(archivedByAccountId), updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    async archiveByOwner({ eventId, ownerAccountId, archivedByAccountId, now }, options = {}) {
      const filter = { eventId: id(eventId), ownerAccountId: id(ownerAccountId), status: 'active' }
      const entries = await collection.find(filter, options).sort({ createdAt: 1, _id: 1 }).toArray()
      if (entries.length === 0) return []
      const result = await collection.updateMany(filter, { $set: { status: 'archived',
        archiveReason: 'participant_removed', archivedAt: now,
        archivedByAccountId: id(archivedByAccountId), updatedAt: now } }, options)
      if (result.modifiedCount !== entries.length) throw new Error('PARTIAL_ENTRY_ARCHIVE')
      return entries.map((entry) => ({ ...entry, status: 'archived', archiveReason: 'participant_removed',
        archivedAt: now, archivedByAccountId: id(archivedByAccountId), updatedAt: now }))
    },
  })
}
