import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { createCategory } from '../domain/event-category.js'
import { digestIdempotencyRequest } from '../domain/security.js'
import { addEventCategoryInputSchema, archiveEventCategoryInputSchema, renameEventCategoryInputSchema,
  updateEventCategoryInputSchema } from '../domain/validation.js'
import { toEventView } from '../domain/event.js'
import { projectEventEntries } from './event-service.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: error.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join('.') : 'input', code: issue.code, message: issue.message,
  })) })
}

export function createEventCategoryService({ eventRepository, idempotencyRepository,
  eventEntryRepository = null, accountRepository = null, auditRepository = null,
  withTransaction = async (operation) => operation(null),
  digestRequest = digestIdempotencyRequest, now = () => new Date(), logger }) {
  async function requireOwner(eventId, viewer, options = {}) {
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = await eventRepository.findById(eventId, options)
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

  async function projectEvent(event, viewerId, options = {}) {
    if (!eventEntryRepository || !accountRepository) return toEventView(event, viewerId)
    const entries = await eventEntryRepository.listActiveByEvent(event._id, options)
    const accounts = await accountRepository.findByIds(entries.map(({ ownerAccountId }) => ownerAccountId), options)
    return projectEventEntries(event, entries, accounts, viewerId)
  }

  function sameInstant(left, right) {
    return new Date(left).getTime() === new Date(right).getTime()
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
    async updateCategory(rawInput, viewer, { correlationId = 'category-update' } = {}) {
      const parsed = updateEventCategoryInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const input = parsed.data
      const identity = { scope: `${viewer.account._id}:${input.eventId}`,
        operation: 'updateEventCategory', key: input.idempotencyKey }
      const requestDigest = digestRequest(input)
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const event = await eventRepository.findById(prior.resultReference.eventId)
        return { event: await projectEvent(event, viewer.account._id) }
      }
      const startedAt = process.hrtime.bigint()
      const timestamp = now()
      let summary
      try {
        summary = await withTransaction(async (session) => {
          const options = session ? { session } : {}
          const event = await requireOwner(input.eventId, viewer, options)
          const category = event.categories?.find(({ _id }) => String(_id) === input.categoryId)
          if (!category) throw new ApplicationError(ErrorCode.NOT_FOUND)
          if (!sameInstant(category.updatedAt, input.expectedCategoryUpdatedAt)) {
            throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
              internalMessage: 'This category changed while you were editing. Refresh and try again.' })
          }
          const currentEntries = await eventEntryRepository.listActiveByEventAndCategory(
            event._id, category._id, options)
          const submitted = new Map(input.entryTitles.map((entry) => [entry.entryId, entry]))
          if (submitted.size !== currentEntries.length || currentEntries.some((entry) => !submitted.has(String(entry._id)))) {
            throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
              internalMessage: 'The category entries changed while you were editing. Refresh and try again.' })
          }
          const stale = currentEntries.some((entry) => !sameInstant(
            entry.updatedAt, submitted.get(String(entry._id)).expectedUpdatedAt))
          if (stale) throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
            internalMessage: 'An entry changed while you were editing. Refresh and try again.' })
          const categoryChanged = category.title !== input.title
          const changes = currentEntries.flatMap((entry) => {
            const desired = submitted.get(String(entry._id))
            return entry.title === desired.title ? [] : [{ entryId: entry._id, eventId: event._id,
              categoryId: category._id, title: desired.title, expectedUpdatedAt: entry.updatedAt }]
          })
          let savedEvent = event
          if (categoryChanged) {
            savedEvent = await eventRepository.updateCategoryTitle(event._id, viewer.account._id, category._id,
              input.title, category.updatedAt, timestamp, options)
            if (!savedEvent) throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
              internalMessage: 'The category title is already used or changed.' })
          }
          try {
            await eventEntryRepository.updateTitles(changes, timestamp, options)
          } catch (error) {
            if (error.message === 'STALE_ENTRY_SNAPSHOT') throw new ApplicationError(ErrorCode.CONFLICT)
            throw error
          }
          if (changes.length > 0 && !categoryChanged) {
            savedEvent = await eventRepository.touch(event._id, viewer.account._id, timestamp, options)
          }
          await idempotencyRepository.create({ ...identity, requestDigest,
            resultReference: { eventId: event._id, categoryId: category._id,
              entryIds: changes.map(({ entryId }) => entryId), categoryTitleChanged: categoryChanged },
            expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
          for (const change of changes) {
            await auditRepository?.append({ name: 'entry.title_changed', actorAccountId: viewer.account._id,
              subjectType: 'eventEntry', subjectId: change.entryId, outcome: 'success', correlationId,
              metadata: { categoryId: String(category._id), entryId: String(change.entryId) } }, options)
          }
          return { event: savedEvent, categoryChanged, changedEntryCount: changes.length, options }
        })
      } catch (error) {
        logger?.warn({ operation: 'event.category_batch_update', outcome: 'failure', errorCode: error.code,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000, correlationId },
        'Event category batch update failed')
        throw error
      }
      logger?.info({ operation: 'event.category_batch_update', outcome: 'success',
        changedEntryCount: summary.changedEntryCount, categoryTitleChanged: summary.categoryChanged,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000, correlationId },
      'Event category batch updated')
      const refreshed = await eventRepository.findById(input.eventId)
      return { event: await projectEvent(refreshed, viewer.account._id) }
    },
    async archiveCategory(rawInput, viewer, { correlationId = 'category-archive' } = {}) {
      const parsed = archiveEventCategoryInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const input = parsed.data
      const identity = { scope: `${viewer.account._id}:${input.eventId}`,
        operation: 'archiveEventCategory', key: input.idempotencyKey }
      const requestDigest = digestRequest(input)
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        return { event: await projectEvent(await eventRepository.findById(input.eventId), viewer.account._id) }
      }
      const startedAt = process.hrtime.bigint()
      const timestamp = now()
      let summary
      try {
        summary = await withTransaction(async (session) => {
          const options = session ? { session } : {}
          const event = await requireOwner(input.eventId, viewer, options)
          const activeCategories = (event.categories ?? []).filter(({ status }) => status !== 'archived')
          const category = activeCategories.find(({ _id }) => String(_id) === input.categoryId)
          if (!category) throw new ApplicationError(ErrorCode.NOT_FOUND)
          if (activeCategories.length <= 1) throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
            internalMessage: 'Every event needs at least one category.' })
          if (!sameInstant(event.updatedAt, input.expectedEventUpdatedAt)
            || !sameInstant(category.updatedAt, input.expectedCategoryUpdatedAt)) {
            throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
              internalMessage: 'The event changed while you were confirming removal. Refresh and try again.' })
          }
          const entries = await eventEntryRepository.listActiveByEventAndCategory(event._id, category._id, options)
          const submitted = new Map(input.activeEntries.map((entry) => [entry.entryId, entry]))
          if (submitted.size !== entries.length || entries.some((entry) => !submitted.has(String(entry._id))
            || !sameInstant(entry.updatedAt, submitted.get(String(entry._id)).expectedUpdatedAt))) {
            throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
              internalMessage: 'The category entries changed. Refresh and try again.' })
          }
          const replacement = category.isDefault ? activeCategories.filter(({ _id }) => String(_id) !== input.categoryId)
            .sort((left, right) => left.createdAt - right.createdAt || String(left._id).localeCompare(String(right._id)))[0] : null
          const categories = event.categories.map((item) => {
            if (String(item._id) === input.categoryId) return { ...item, status: 'archived',
              archiveReason: 'category_removed', archivedAt: timestamp,
              archivedByAccountId: viewer.account._id, updatedAt: timestamp }
            if (replacement && String(item._id) === String(replacement._id)) return { ...item, isDefault: true,
              updatedAt: timestamp }
            return item
          })
          const saved = await eventRepository.archiveCategory({ eventId: event._id,
            ownerAccountId: viewer.account._id, categoryId: category._id,
            expectedEventUpdatedAt: event.updatedAt, expectedCategoryUpdatedAt: category.updatedAt,
            categories, now: timestamp }, options)
          if (!saved) throw new ApplicationError(ErrorCode.CONFLICT)
          try {
            await eventEntryRepository.archiveByCategory({ eventId: event._id, categoryId: category._id,
              entryIds: entries.map(({ _id }) => _id), archivedByAccountId: viewer.account._id, now: timestamp }, options)
          } catch (error) {
            if (error.message === 'STALE_CATEGORY_ENTRY_SNAPSHOT') throw new ApplicationError(ErrorCode.CONFLICT)
            throw error
          }
          await auditRepository?.append({ name: 'event.category_archived', actorAccountId: viewer.account._id,
            subjectType: 'event', subjectId: event._id, outcome: 'success', correlationId,
            metadata: { categoryId: String(category._id), entryCount: entries.length,
              ...(replacement ? { promotedCategoryId: String(replacement._id) } : {}) } }, options)
          for (const entry of entries) await auditRepository?.append({ name: 'entry.archived',
            actorAccountId: viewer.account._id, subjectType: 'eventEntry', subjectId: entry._id,
            outcome: 'success', correlationId, metadata: { categoryId: String(category._id),
              entryId: String(entry._id), archiveReason: 'category_removed' } }, options)
          await idempotencyRepository.create({ ...identity, requestDigest,
            resultReference: { eventId: event._id, categoryId: category._id,
              entryIds: entries.map(({ _id }) => _id), promotedCategoryId: replacement?._id ?? null },
            expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
          return { entryCount: entries.length, promoted: Boolean(replacement) }
        })
      } catch (error) {
        logger?.warn({ operation: 'event.category_archive', outcome: 'failure', errorCode: error.code,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000, correlationId },
        'Event category archival failed')
        throw error
      }
      logger?.info({ operation: 'event.category_archive', outcome: 'success', entryCount: summary.entryCount,
        defaultPromoted: summary.promoted, durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        correlationId }, 'Event category archived')
      return { event: await projectEvent(await eventRepository.findById(input.eventId), viewer.account._id) }
    },
  })
}
