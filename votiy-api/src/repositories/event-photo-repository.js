import { ObjectId } from 'mongodb'

const id = (value) => value instanceof ObjectId ? value : new ObjectId(value)

export function createEventPhotoRepository(database) {
  const collection = database.collection('eventPhotos')
  return Object.freeze({
    findByEventId(eventId, options = {}) {
      return collection.findOne({ eventId: id(eventId) }, options)
    },
    findByPublicId(publicId, options = {}) {
      return collection.findOne({ publicId }, options)
    },
    async upsert({ event, actorAccountId, processed, now = new Date() }, options = {}) {
      const existing = await collection.findOne({ eventId: id(event._id) }, options)
      const revision = (existing?.revision ?? 0) + 1
      const document = {
        eventId: id(event._id),
        publicId: event.publicId,
        data: processed.data,
        contentType: processed.contentType,
        width: processed.width,
        height: processed.height,
        byteLength: processed.byteLength,
        revision,
        etag: processed.etag,
        createdByAccountId: existing?.createdByAccountId ?? id(actorAccountId),
        updatedByAccountId: id(actorAccountId),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        schemaVersion: 1,
      }
      await collection.replaceOne({ eventId: id(event._id) }, document, { ...options, upsert: true })
      return document
    },
    async deleteByEventId(eventId, options = {}) {
      return collection.findOneAndDelete({ eventId: id(eventId) }, options)
    },
  })
}
