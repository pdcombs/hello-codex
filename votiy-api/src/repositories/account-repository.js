import { ObjectId } from 'mongodb'
import { createPendingAccount, createProvisionalAccount } from '../domain/account.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createAccountRepository(database) {
  const collection = database.collection('accounts')
  return Object.freeze({
    findById: (accountId, options = {}) => collection.findOne({ _id: id(accountId) }, options),
    findByIds: (accountIds, options = {}) => collection.find({ _id: { $in: accountIds.map(id) } }, options).toArray(),
    findByEmailNormalized: (emailNormalized, options = {}) => collection.findOne({ emailNormalized }, options),
    findByPhoneNormalized: (phoneNormalized, options = {}) => collection.findOne({ phoneNormalized }, options),
    searchByContactPrefix({ type, prefix, limit = 10 }, options = {}) {
      const field = type === 'phone' ? 'phoneNormalized' : 'emailNormalized'
      return collection.find({ [field]: { $type: 'string', $gte: prefix, $lt: `${prefix}\uffff` } }, options)
        .sort({ _id: 1 }).limit(Math.min(limit, 10)).toArray()
    },
    async createPending(input, options = {}) {
      const account = createPendingAccount(input)
      await collection.insertOne(account, options)
      return account
    },
    async createProvisional(input, options = {}) {
      const account = createProvisionalAccount(input)
      await collection.insertOne(account, options)
      return account
    },
    async markVerified(accountId, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(accountId), verificationStatus: 'pending' },
        { $set: { verificationStatus: 'verified', verifiedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
  })
}
