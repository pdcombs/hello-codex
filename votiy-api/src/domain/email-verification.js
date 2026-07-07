import { ObjectId } from 'mongodb'

export function createEmailVerification({ accountId, tokenDigest, expiresAt, now = new Date() }) {
  if (!tokenDigest || !(expiresAt instanceof Date) || expiresAt <= now) {
    throw new TypeError('Invalid email verification')
  }
  return Object.freeze({
    _id: new ObjectId(),
    accountId: accountId instanceof ObjectId ? accountId : new ObjectId(accountId),
    tokenDigest,
    expiresAt,
    consumedAt: null,
    createdAt: now,
    schemaVersion: 1,
  })
}
