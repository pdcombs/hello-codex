import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { processEventPhoto } from '../domain/event-photo.js'

function metadata(photo) {
  return photo ? Object.freeze({
    url: `/event-media/${photo.publicId}/photo`,
    revision: photo.revision,
    width: photo.width,
    height: photo.height,
    updatedAt: photo.updatedAt,
  }) : null
}

export function createEventPhotoService({
  eventRepository,
  photoRepository,
  idempotencyRepository,
  auditRepository,
  processor = processEventPhoto,
  logger,
}) {
  async function requireOwner(eventId, viewer) {
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = await eventRepository.findById(eventId)
    if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
    if (String(event.ownerAccountId) !== String(viewer.account._id)) {
      throw new ApplicationError(ErrorCode.FORBIDDEN)
    }
    if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
    return event
  }

  return Object.freeze({
    metadata,
    async upload({ eventId, bytes, contentType, idempotencyKey, viewer, correlationId }) {
      const event = await requireOwner(eventId, viewer)
      const identity = { scope: `event-photo:${eventId}`, operation: 'putEventPhoto', key: idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        const current = await photoRepository.findByEventId(eventId)
        if (current?.etag !== prior.requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        return { photo: metadata(current), created: prior.resultReference.created }
      }
      const startedAt = process.hrtime.bigint()
      const processed = await processor(bytes, contentType)
      const before = await photoRepository.findByEventId(eventId)
      const saved = await photoRepository.upsert({ event, actorAccountId: viewer.account._id, processed })
      await idempotencyRepository.create({
        ...identity,
        requestDigest: saved.etag,
        resultReference: { eventId: String(event._id), revision: saved.revision, created: !before },
        expiresAt: new Date(Date.now() + 86_400_000),
        createdAt: new Date(),
      })
      await auditRepository?.append({
        name: before ? 'event.photo_replaced' : 'event.photo_uploaded',
        actorAccountId: viewer.account._id,
        subjectType: 'event',
        subjectId: event._id,
        outcome: 'success',
        correlationId,
        metadata: { photoRevision: saved.revision, width: saved.width, height: saved.height,
          byteLength: saved.byteLength },
      })
      logger?.info({ event: 'event.photo_upload', operation: 'event.photo_upload', outcome: 'success',
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000, inputBytes: bytes.length,
        outputBytes: saved.byteLength, correlationId }, 'Event photo uploaded')
      return { photo: metadata(saved), created: !before }
    },
    async read(publicId) {
      return photoRepository.findByPublicId(publicId)
    },
    async remove({ eventId, idempotencyKey, viewer, correlationId }) {
      const event = await requireOwner(eventId, viewer)
      const identity = { scope: `event-photo:${eventId}`, operation: 'deleteEventPhoto', key: idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) return prior.resultReference
      const removed = await photoRepository.deleteByEventId(eventId)
      if (!removed) throw new ApplicationError(ErrorCode.NOT_FOUND)
      const result = { deleted: true, deletedRevision: removed.revision }
      await idempotencyRepository.create({
        ...identity,
        requestDigest: String(removed.revision),
        resultReference: result,
        expiresAt: new Date(Date.now() + 86_400_000),
        createdAt: new Date(),
      })
      await auditRepository?.append({
        name: 'event.photo_deleted',
        actorAccountId: viewer.account._id,
        subjectType: 'event',
        subjectId: event._id,
        outcome: 'success',
        correlationId,
        metadata: { photoRevision: removed.revision, width: removed.width, height: removed.height,
          byteLength: removed.byteLength },
      })
      return result
    },
  })
}
