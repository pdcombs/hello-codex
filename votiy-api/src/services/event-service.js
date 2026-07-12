import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { toEventView } from '../domain/event.js'
import { toEntryView } from '../domain/event-entry.js'
import { digestIdempotencyRequest, generateOpaqueToken } from '../domain/security.js'
import { eventInputSchema, setEventRegistrationPolicyInputSchema } from '../domain/validation.js'
import { logGroupedView } from '../observability/logger.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, {
    fieldErrors: error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'input'),
      code: issue.code,
      message: issue.message,
    })),
  })
}

export function createEventService({
  eventRepository,
  eventRegistrationRepository = null,
  accountRepository = null,
  idempotencyRepository,
  generatePublicId = () => generateOpaqueToken(16),
  digestRequest = digestIdempotencyRequest,
  now = () => new Date(),
  logger,
}) {
  async function projectSetup(event, viewerAccountId) {
    if (!eventRegistrationRepository || !accountRepository) return toEventView(event, viewerAccountId)
    const startedAt = process.hrtime.bigint()
    const registrations = (await eventRegistrationRepository.listByEvent(event._id))
      .filter(({ status }) => status === 'registered')
    const accounts = await accountRepository.findByIds(registrations.map(({ accountId }) => accountId))
    const result = projectEventSetup(event, registrations, accounts, viewerAccountId)
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    logGroupedView(logger, { outcome: 'success', durationMs, categoryCount: result.categories.length,
      entryCount: result.categories.reduce((sum, category) => sum + category.entries.length, 0) })
    return result
  }

  return Object.freeze({
    async createEvent(rawInput, viewer) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      if (viewer.account.verificationStatus !== 'verified') throw new ApplicationError(ErrorCode.EMAIL_NOT_VERIFIED)
      const parsed = eventInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const input = parsed.data
      const ownerAccountId = String(viewer.account._id)
      const requestDigest = digestRequest(input)
      const identity = { scope: ownerAccountId, operation: 'createEvent', key: input.idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const event = await eventRepository.findById(prior.resultReference.eventId)
        return { event: toEventView(event, ownerAccountId) }
      }
      const timestamp = now()
      const event = await eventRepository.create({
        schemaVersion: 2,
        ownerAccountId,
        publicId: generatePublicId(),
        title: input.title,
        description: input.description,
        location: input.location,
        registrationPolicy: input.registrationPolicy === 'OPEN' ? 'open' : 'admin_managed',
        now: timestamp,
      })
      await idempotencyRepository.create({
        ...identity,
        requestDigest,
        resultReference: { eventId: event._id },
        expiresAt: new Date(timestamp.getTime() + 86_400_000),
        createdAt: timestamp,
      })
      logger?.info({ operation: 'event.create', outcome: 'success' }, 'Event created')
      return { event: toEventView(event, ownerAccountId) }
    },

    async ownedEvents({ viewer, first = 20, after = null }) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const rows = await eventRepository.listByOwner(viewer.account._id, { first, after })
      const hasMore = rows.length > first
      const nodes = rows.slice(0, first).map((event) => toEventView(event, viewer.account._id))
      return {
        events: {
          nodes,
          nextCursor: hasMore ? rows[first - 1].createdAt.toISOString() : null,
        },
      }
    },

    async eventByPublicId({ publicId, viewer = null }) {
      const event = await eventRepository.findByPublicId(publicId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      try {
        return { event: await projectSetup(event, viewer?.account?._id ?? null) }
      } catch (error) {
        logGroupedView(logger, { outcome: 'failure', durationMs: 0, errorCode: error.code ?? ErrorCode.SERVICE_UNAVAILABLE })
        throw error
      }
    },

    async setRegistrationPolicy(rawInput, viewer) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const parsed = setEventRegistrationPolicyInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const timestamp = now()
      const event = await eventRepository.updateRegistrationPolicy(
        parsed.data.eventId,
        viewer.account._id,
        parsed.data.registrationPolicy === 'OPEN' ? 'open' : 'admin_managed',
        timestamp,
      )
      if (!event) throw new ApplicationError(ErrorCode.FORBIDDEN)
      logger?.info({ operation: 'event.policy_change', outcome: 'success' }, 'Event registration policy updated')
      return { event: toEventView(event, viewer.account._id) }
    },
  })
}

export function projectEventSetup(event, registrations, accounts, viewerAccountId = null) {
  const base = toEventView(event, viewerAccountId)
  const accountsById = new Map(accounts.map((account) => [String(account._id), account]))
  const entriesByCategory = new Map((event.categories ?? []).map(({ _id }) => [String(_id), []]))
  for (const registration of registrations) {
    if (registration.status !== 'registered') continue
    const owner = accountsById.get(String(registration.accountId))
    if (!owner?.displayName) continue
    for (const entry of registration.entries ?? []) {
      entriesByCategory.get(String(entry.categoryId))?.push(toEntryView(entry, owner))
    }
  }
  return Object.freeze({ ...base, categories: base.categories.map((category) => Object.freeze({
    ...category, entries: entriesByCategory.get(category.id) ?? [],
  })) })
}
