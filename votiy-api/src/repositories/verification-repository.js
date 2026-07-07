import { ObjectId } from 'mongodb'
import { createEmailVerification } from '../domain/email-verification.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createVerificationRepository(database) {
  const collection = database.collection('emailVerifications')
  return Object.freeze({
    async create(input) {
      const verification = createEmailVerification(input)
      await collection.insertOne(verification)
      return verification
    },
    supersedeActiveForAccount(accountId, now) {
      return collection.updateMany(
        { accountId: id(accountId), consumedAt: null, expiresAt: { $gt: now } },
        { $set: { consumedAt: now } },
      )
    },
    consumeActive(tokenDigest, now) {
      return collection.findOneAndUpdate(
        { tokenDigest, consumedAt: null, expiresAt: { $gt: now } },
        { $set: { consumedAt: now } },
        { returnDocument: 'after' },
      )
    },
  })
}
