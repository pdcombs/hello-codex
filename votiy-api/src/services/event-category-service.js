import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { createCategory } from '../domain/event-category.js'
import { digestIdempotencyRequest } from '../domain/security.js'
import { addEventCategoryInputSchema, renameEventCategoryInputSchema } from '../domain/validation.js'
import { toEventView } from '../domain/event.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : 'input', code: issue.code, message: issue.message,
  })) })
}

export function createEventCategoryService({ eventRepository, idempotencyRepository,
  digestRequest = digestIdempotencyRequest, now = () => new Date(), logger }) {
  async function requireOwner(eventId, viewer) {
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = await eventRepository.findById(eventId)
    if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
    if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
    return event
  }

  async function idempotent(identity, digest, viewerId) {
    const prior = await idempotencyRepository.find(identity)
    if (!prior) return null
    if (prior.requestDigest !== digest) throw new ApplicationError(ErrorCode.CONFLICT)
    const event = await eventRepository.findById(prior.resultReference.eventId)
    return { event: toEventView(event, viewerId) }
  }

  return Object.freeze({
    async addCategory(rawInput, viewer) {
      const parsed = addEventCategoryInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const current = await requireOwner(parsed.data.eventId, viewer)
      const identity = { scope: `${viewer.account._id}:${current._id}`, operation: 'addEventCategory', key: parsed.data.idempotencyKey }
      const digest = digestRequest(parsed.data)
      const prior = await idempotent(identity, digest, viewer.account._id)
      if (prior) return prior
      const timestamp = now()
      const category = createCategory({ title: parsed.data.title, now: timestamp })
      const event = await eventRepository.appendCategory(current._id, viewer.account._id, category)
      if (!event) throw new ApplicationError(ErrorCode.CONFLICT, { internalMessage: current.categories.length >= 100
        ? 'An event can have at most 100 categories.' : 'Category titles must be unique.', exposeMessage: true })
      await idempotencyRepository.create({ ...identity, requestDigest: digest, resultReference: { eventId: event._id },
        expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp })
      logger?.info({ operation: 'event.category_add', outcome: 'success' }, 'Event category added')
      return { event: toEventView(event, viewer.account._id) }
    },
    async renameCategory(rawInput, viewer) {
      const parsed = renameEventCategoryInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const current = await requireOwner(parsed.data.eventId, viewer)
      if (!current.categories.some(({ _id }) => String(_id) === parsed.data.categoryId)) throw new ApplicationError(ErrorCode.NOT_FOUND)
      const identity = { scope: `${viewer.account._id}:${current._id}`, operation: 'renameEventCategory', key: parsed.data.idempotencyKey }
      const digest = digestRequest(parsed.data)
      const prior = await idempotent(identity, digest, viewer.account._id)
      if (prior) return prior
      const timestamp = now()
      const event = await eventRepository.renameCategory(current._id, viewer.account._id, parsed.data.categoryId, parsed.data.title, timestamp)
      if (!event) throw new ApplicationError(ErrorCode.CONFLICT, { internalMessage: 'Category titles must be unique.', exposeMessage: true })
      await idempotencyRepository.create({ ...identity, requestDigest: digest, resultReference: { eventId: event._id },
        expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp })
      logger?.info({ operation: 'event.category_rename', outcome: 'success' }, 'Event category renamed')
      return { event: toEventView(event, viewer.account._id) }
    },
  })
}
