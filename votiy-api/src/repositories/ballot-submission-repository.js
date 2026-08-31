import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createBallotSubmissionRepository(database) {
  const collection = database.collection('ballotSubmissions')
  return Object.freeze({
    async create(document, options = {}) { await collection.insertOne(document, options); return document },
    countByAccount(eventId, accountId, options = {}) {
      return collection.countDocuments({ eventId: id(eventId), accountId: id(accountId) }, options)
    },
    countByBrowserMarker(eventId, browserMarkerDigest, options = {}) {
      return collection.countDocuments({ eventId: id(eventId), browserMarkerDigest }, options)
    },
    findById(ballotId, options = {}) { return collection.findOne({ _id: id(ballotId) }, options) },
    findByAccessCode(accessCodeId, options = {}) {
      return collection.findOne({ accessCodeId: id(accessCodeId) }, options)
    },
    findLatestByAccount(eventId, accountId, options = {}) {
      return collection.findOne({ eventId: id(eventId), accountId: id(accountId) },
        { ...options, sort: { submittedAt: -1, _id: -1 } })
    },
    findLatestByBrowserMarker(eventId, browserMarkerDigest, options = {}) {
      return collection.findOne({ eventId: id(eventId), browserMarkerDigest },
        { ...options, sort: { submittedAt: -1, _id: -1 } })
    },
  })
}
