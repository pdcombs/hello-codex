import { ObjectId } from 'mongodb'
const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createBallotSubmissionRepository(database) {
  const collection = database.collection('ballotSubmissions')
  const historyFilter = (identity, after) => ({ ...identity, ...(after ? { $or: [
    { submittedAt: { $lt: after.submittedAt } },
    { submittedAt: after.submittedAt, _id: { $lt: after.id } },
  ] } : {}) })
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
    listByAccount(eventId, accountId, { first = 20, after = null, ...options } = {}) {
      return collection.find(historyFilter({ eventId: id(eventId), accountId: id(accountId) }, after), options)
        .sort({ submittedAt: -1, _id: -1 }).limit(first + 1).toArray()
    },
    listByBrowserMarker(eventId, browserMarkerDigest, { first = 20, after = null, ...options } = {}) {
      return collection.find(historyFilter({ eventId: id(eventId), browserMarkerDigest }, after), options)
        .sort({ submittedAt: -1, _id: -1 }).limit(first + 1).toArray()
    },
  })
}
