import { ObjectId } from 'mongodb'
import { createSessionDocument } from '../domain/session.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createSessionRepository(database) {
  const collection = database.collection('sessions')
  return Object.freeze({
    async create(input) {
      const session = createSessionDocument(input)
      await collection.insertOne(session)
      return session
    },
    findActiveByDigest(secretDigest, now) {
      return collection.findOne({ secretDigest, revokedAt: null, expiresAt: { $gt: now } })
    },
    revokeActiveForAccount(accountId, now) {
      return collection.updateMany({ accountId: id(accountId), revokedAt: null }, { $set: { revokedAt: now } })
    },
    revokeByDigest(secretDigest, now) {
      return collection.updateOne({ secretDigest, revokedAt: null }, { $set: { revokedAt: now } })
    },
    touchLastSeen(sessionId, previous, now, throttleMs = 300_000) {
      if (now.getTime() - previous.getTime() < throttleMs) return Promise.resolve(false)
      return collection.updateOne({ _id: id(sessionId), lastSeenAt: previous }, { $set: { lastSeenAt: now } })
    },
  })
}
