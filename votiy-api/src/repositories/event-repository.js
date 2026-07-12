import { ObjectId } from 'mongodb'
import { createEventDocument, withEventVersion2 } from '../domain/event.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRepository(database) {
  const collection = database.collection('events')

  return Object.freeze({
    async create(input, options = {}) {
      const event = input.schemaVersion === 2
        ? withEventVersion2(createEventDocument(input), { now: input.now })
        : createEventDocument(input)
      await collection.insertOne(event, options)
      return event
    },
    findById(eventId, options = {}) {
      return collection.findOne({ _id: id(eventId) }, options)
    },
    findByPublicId(publicId, options = {}) {
      return collection.findOne({ publicId }, options)
    },
    async requireCategoryIds(eventId, categoryIds, options = {}) {
      const event = await collection.findOne({ _id: id(eventId) }, { projection: { categories: 1 }, ...options })
      if (!event) return null
      const available = new Set((event.categories ?? []).map(({ _id }) => String(_id)))
      return categoryIds.every((categoryId) => available.has(String(categoryId))) ? event : null
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
