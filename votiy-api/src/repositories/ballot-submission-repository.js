import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createBallotSubmissionRepository(database) {
  const collection = database.collection('ballotSubmissions')
  return Object.freeze({
    async create(document, options = {}) { await collection.insertOne(document, options); return document },
    countByAccount(eventId, accountId, options = {}) {
      return collection.countDocuments({ eventId: id(eventId), accountId: id(accountId) }, options)
    },
    findById(ballotId, options = {}) { return collection.findOne({ _id: id(ballotId) }, options) },
  })
}
