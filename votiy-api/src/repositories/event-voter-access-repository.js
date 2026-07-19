import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createEventVoterAccessRepository(database) {
  const collection = database.collection('eventVoterAccess')
  return Object.freeze({
    find(eventId, accountId, options = {}) {
      return collection.findOne({ eventId: id(eventId), accountId: id(accountId) }, options)
    },
    async grant({ eventId, accountId, source, codeId = null, now }, options = {}) {
      return collection.findOneAndUpdate(
        { eventId: id(eventId), accountId: id(accountId) },
        { $setOnInsert: { _id: new ObjectId(), createdAt: now, schemaVersion: 1 },
          $set: { source, codeId: codeId ? id(codeId) : null, status: 'active', grantedAt: now, revokedAt: null, updatedAt: now } },
        { upsert: true, returnDocument: 'after', ...options },
      )
    },
  })
}
