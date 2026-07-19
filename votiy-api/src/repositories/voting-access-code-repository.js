import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createVotingAccessCodeRepository(database) {
  const collection = database.collection('votingAccessCodes')
  return Object.freeze({
    exists(eventId, codeDigest, options = {}) {
      return collection.findOne({ eventId: id(eventId), codeDigest }, { projection: { _id: 1 }, ...options })
    },
    async createMany(documents, options = {}) {
      if (documents.length) await collection.insertMany(documents, options)
      return documents
    },
    countByEvent(eventId, options = {}) {
      return collection.countDocuments({ eventId: id(eventId) }, options)
    },
    findUnused(eventId, codeDigest, options = {}) {
      return collection.findOne({ eventId: id(eventId), codeDigest, status: 'unused' }, options)
    },
    consume({ codeId, accountId, ballotId, now }, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(codeId), status: 'unused' },
        { $set: { status: 'used', claimedByAccountId: id(accountId), usedByBallotId: id(ballotId), usedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    listByEvent(eventId, { after = null, limit = 50, ...options } = {}) {
      const filter = { eventId: id(eventId), ...(after ? { _id: { $gt: id(after) } } : {}) }
      return collection.find(filter, options).sort({ _id: 1 }).limit(Math.min(limit, 100)).toArray()
    },
    listByBatch(eventId, batchId, options = {}) {
      return collection.find({ eventId: id(eventId), batchId: id(batchId) }, options).sort({ _id: 1 }).toArray()
    },
  })
}
