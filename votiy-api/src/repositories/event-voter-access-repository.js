import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createEventVoterAccessRepository(database) {
  const collection = database.collection('eventVoterAccess')
  return Object.freeze({
    find(eventId, accountId, options = {}) {
      return collection.findOne({ eventId: id(eventId), accountId: id(accountId) }, options)
    },
    findByBrowser(eventId, browserMarkerDigest, options = {}) {
      return collection.findOne({ eventId: id(eventId), browserMarkerDigest, status: 'active' }, options)
    },
    async grant({ eventId, accountId = null, browserMarkerDigest = null, source, codeId = null,
      rulesVersion = 1, now }, options = {}) {
      const identity = accountId ? { accountId: id(accountId) } : { browserMarkerDigest }
      return collection.findOneAndUpdate(
        { eventId: id(eventId), ...identity },
        { $setOnInsert: { _id: new ObjectId(), createdAt: now, schemaVersion: 1 },
          $set: { accountId: accountId ? id(accountId) : null, browserMarkerDigest, source,
            codeId: codeId ? id(codeId) : null, status: 'active', rulesVersion,
            grantedAt: now, revokedAt: null, updatedAt: now } },
        { upsert: true, returnDocument: 'after', ...options },
      )
    },
  })
}
