import { ObjectId } from 'mongodb'
import { createEventRegistrationDocument } from '../domain/event-registration.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRegistrationRepository(database) {
  const collection = database.collection('eventRegistrations')

  return Object.freeze({
    findById(registrationId, options = {}) {
      return collection.findOne({ _id: id(registrationId) }, options)
    },
    findByEventAndAccount(eventId, accountId, options = {}) {
      return collection.findOne({ eventId: id(eventId), accountId: id(accountId) }, options)
    },
    listByEvent(eventId) {
      return collection.find({ eventId: id(eventId) }).sort({ createdAt: 1 }).toArray()
    },
    async create(input, options = {}) {
      const registration = createEventRegistrationDocument(input)
      await collection.insertOne(registration, options)
      return registration
    },
    revive(registrationId, registeredByAccountId, registrationSource, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(registrationId) },
        {
          $set: {
            status: 'registered',
            registeredByAccountId: id(registeredByAccountId),
            registrationSource,
            removedAt: null,
            updatedAt: now,
          },
        },
        { returnDocument: 'after', ...options },
      )
    },
    remove(registrationId, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(registrationId), status: 'registered' },
        { $set: { status: 'removed', removedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
  })
}
