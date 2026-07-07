import { ObjectId } from 'mongodb'
import { createEventRegistrationDocument } from '../domain/event-registration.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRegistrationRepository(database) {
  const collection = database.collection('eventRegistrations')

  return Object.freeze({
    findById(registrationId) {
      return collection.findOne({ _id: id(registrationId) })
    },
    findByEventAndAccount(eventId, accountId) {
      return collection.findOne({ eventId: id(eventId), accountId: id(accountId) })
    },
    listByEvent(eventId) {
      return collection.find({ eventId: id(eventId) }).sort({ createdAt: 1 }).toArray()
    },
    async create(input) {
      const registration = createEventRegistrationDocument(input)
      await collection.insertOne(registration)
      return registration
    },
    revive(registrationId, registeredByAccountId, registrationSource, now) {
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
        { returnDocument: 'after' },
      )
    },
    remove(registrationId, now) {
      return collection.findOneAndUpdate(
        { _id: id(registrationId), status: 'registered' },
        { $set: { status: 'removed', removedAt: now, updatedAt: now } },
        { returnDocument: 'after' },
      )
    },
  })
}
