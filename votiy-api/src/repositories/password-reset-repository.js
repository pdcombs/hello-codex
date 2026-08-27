import { ObjectId } from 'mongodb'
import { createPasswordResetRequest } from '../domain/password-reset.js'

const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createPasswordResetRepository(database) {
  const collection = database.collection('passwordResetRequests')
  return Object.freeze({
    async create(input, options = {}) {
      const record = createPasswordResetRequest(input)
      await collection.insertOne(record, options)
      return record
    },
    findActiveByDigest(tokenDigest, now, options = {}) {
      return collection.findOne({ tokenDigest, status: 'active', expiresAt: { $gt: now },
        consumedAt: null, supersededAt: null, deliveryFailedAt: null }, options)
    },
    supersedeActiveForAccount(accountId, now, options = {}) {
      return collection.updateMany({ accountId: id(accountId), status: 'active' },
        { $set: { status: 'superseded', supersededAt: now, updatedAt: now } }, options)
    },
    markDeliveryFailed(resetId, now, options = {}) {
      return collection.findOneAndUpdate({ _id: id(resetId), status: 'active' },
        { $set: { status: 'delivery_failed', deliveryFailedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options })
    },
    consumeActive(resetId, now, options = {}) {
      return collection.findOneAndUpdate({ _id: id(resetId), status: 'active', expiresAt: { $gt: now },
        consumedAt: null, supersededAt: null, deliveryFailedAt: null },
      { $set: { status: 'consumed', consumedAt: now, updatedAt: now } }, { returnDocument: 'after', ...options })
    },
  })
}
