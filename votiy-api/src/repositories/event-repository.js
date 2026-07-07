import { ObjectId } from 'mongodb'
import { createEventDocument } from '../domain/event.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRepository(database) {
  const collection = database.collection('events')

  return Object.freeze({
    async create(input) {
      const event = createEventDocument(input)
      await collection.insertOne(event)
      return event
    },
    findById(eventId) {
      return collection.findOne({ _id: id(eventId) })
    },
    findByPublicId(publicId) {
      return collection.findOne({ publicId })
    },
    listByOwner(ownerAccountId, { first = 20, after = null } = {}) {
      const query = { ownerAccountId: id(ownerAccountId) }
      if (after) query.createdAt = { $lt: new Date(after) }
      return collection.find(query).sort({ createdAt: -1 }).limit(first + 1).toArray()
    },
    updateRegistrationPolicy(eventId, ownerAccountId, registrationPolicy, now) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId) },
        { $set: { registrationPolicy, updatedAt: now } },
        { returnDocument: 'after' },
      )
    },
  })
}
