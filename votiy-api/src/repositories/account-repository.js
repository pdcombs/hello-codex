import { ObjectId } from 'mongodb'
import { createPendingAccount } from '../domain/account.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createAccountRepository(database) {
  const collection = database.collection('accounts')
  return Object.freeze({
    findById: (accountId) => collection.findOne({ _id: id(accountId) }),
    findByEmailNormalized: (emailNormalized) => collection.findOne({ emailNormalized }),
    async createPending(input) {
      const account = createPendingAccount(input)
      await collection.insertOne(account)
      return account
    },
    async markVerified(accountId, now) {
      return collection.findOneAndUpdate(
        { _id: id(accountId), verificationStatus: 'pending' },
        { $set: { verificationStatus: 'verified', verifiedAt: now, updatedAt: now } },
        { returnDocument: 'after' },
      )
    },
  })
}
