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
    findUnusedById(codeId, options = {}) {
      return collection.findOne({ _id: id(codeId), status: 'unused' }, options)
    },
    consume({ codeId, accountId = null, ballotId, now }, options = {}) {
      if (!ballotId) throw new TypeError('ballotId is required to consume a voting code')
      return collection.findOneAndUpdate(
        { _id: id(codeId), status: 'unused' },
        { $set: { status: 'used', claimedByAccountId: accountId ? id(accountId) : null,
          usedByBallotId: id(ballotId), usedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    countUnusedByEvent(eventId, options = {}) {
      return collection.countDocuments({ eventId: id(eventId), status: 'unused' }, options)
    },
    async countByStatus(eventId, options = {}) {
      const rows = await collection.aggregate([
        { $match: { eventId: id(eventId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ], options).toArray()
      return Object.fromEntries(rows.map((row) => [row._id, row.count]))
    },
    listByEvent(eventId, { after = null, limit = 50, ...options } = {}) {
      const offset = Math.max(0, Number.parseInt(after ?? '0', 10) || 0)
      return collection.find({ eventId: id(eventId) }, options)
        .sort({ status: -1, usedAt: -1, createdAt: -1, _id: -1 }).skip(offset).limit(Math.min(limit, 100)).toArray()
    },
    listAllByEvent(eventId, options = {}) {
      return collection.find({ eventId: id(eventId) }, options)
        .sort({ status: -1, usedAt: -1, createdAt: -1, _id: -1 }).toArray()
    },
    listByBatch(eventId, batchId, options = {}) {
      return collection.find({ eventId: id(eventId), batchId: id(batchId) }, options).sort({ _id: 1 }).toArray()
    },
  })
}
