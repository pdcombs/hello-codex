import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { normalizeEmail, digestIdempotencyRequest } from '../domain/security.js'
import { toEventRegistrationView } from '../domain/event-registration.js'
import {
  addEventParticipantInputSchema,
  registerForEventInputSchema,
  removeEventParticipantInputSchema,
} from '../domain/validation.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, {
    fieldErrors: error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'input',
      code: issue.code,
      message: issue.message,
    })),
  })
}

async function resolveAccountForIdentifier({ accountRepository, displayName, email, phone, referredByAccountId, now, session }) {
  const emailNormalized = email ? normalizeEmail(email) : null
  const phoneNormalized = phone ? String(phone).trim() : null
  let account = emailNormalized
    ? await accountRepository.findByEmailNormalized(emailNormalized, { session })
    : await accountRepository.findByPhoneNormalized(phoneNormalized, { session })
  let provisionalCreated = false
  if (!account) {
    account = await accountRepository.createProvisional({
      emailNormalized,
      phoneNormalized,
      displayName,
      referredByAccountId,
      now,
    }, { session })
    provisionalCreated = true
  }
  return { account, provisionalCreated }
}

export function createEventRegistrationService({
  eventRepository,
  eventRegistrationRepository,
  accountRepository,
  idempotencyRepository,
  digestRequest = digestIdempotencyRequest,
  withTransaction = async (operation) => operation(null),
  now = () => new Date(),
  logger,
}) {
  async function requireOwner(eventId, viewer, options = {}) {
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = await eventRepository.findById(eventId, options)
    if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
    if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
    return event
  }

  async function materializeRegistrations(registrations) {
    const accounts = await accountRepository.findByIds(registrations.map((item) => item.accountId))
    const byId = new Map(accounts.map((account) => [String(account._id), account]))
    return registrations.map((registration) => toEventRegistrationView(registration, byId.get(String(registration.accountId))))
  }

  return Object.freeze({
    async registerForEvent(rawInput, viewer) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      if (viewer.account.verificationStatus !== 'verified') throw new ApplicationError(ErrorCode.EMAIL_NOT_VERIFIED)
      const parsed = registerForEventInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const event = await eventRepository.findById(parsed.data.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (event.registrationPolicy !== 'open') throw new ApplicationError(ErrorCode.FORBIDDEN)
      const requestDigest = digestRequest(parsed.data)
      const identity = { scope: String(viewer.account._id), operation: 'registerForEvent', key: parsed.data.idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const registration = await eventRegistrationRepository.findById(prior.resultReference.registrationId)
        return { registration: toEventRegistrationView(registration, viewer.account) }
      }
      const timestamp = now()
      const registration = await withTransaction(async (session) => {
        const options = { session }
        if (!await eventRepository.requireCategoryIds(event._id, parsed.data.entries.map(({ categoryId }) => categoryId), options)) {
          throw new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: [{ field: 'entries', code: 'invalid_category', message: 'Choose categories from this event.' }] })
        }
        const existing = await eventRegistrationRepository.findByEventAndAccount(event._id, viewer.account._id, options)
        const saved = existing
          ? existing.status === 'registered'
            ? existing
            : await eventRegistrationRepository.reviveWithEntries(existing._id, viewer.account._id, 'self', parsed.data.entries, timestamp, options)
          : await eventRegistrationRepository.createWithEntries({ eventId: event._id, accountId: viewer.account._id,
            registrationSource: 'self', registeredByAccountId: viewer.account._id, now: timestamp }, parsed.data.entries, options)
        await idempotencyRepository.create({ ...identity, requestDigest, resultReference: { registrationId: saved._id },
          expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        return saved
      })
      logger?.info({ operation: 'event.self_register', outcome: 'success' }, 'Participant self-registered')
      return { registration: toEventRegistrationView(registration, viewer.account) }
    },

    async addParticipant(rawInput, viewer) {
      const parsed = addEventParticipantInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const event = await requireOwner(parsed.data.eventId, viewer)
      const requestDigest = digestRequest(parsed.data)
      const identity = {
        scope: `${viewer.account._id}:${event._id}`,
        operation: 'addEventParticipant',
        key: parsed.data.idempotencyKey,
      }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const registration = await eventRegistrationRepository.findById(prior.resultReference.registrationId)
        const account = await accountRepository.findById(registration.accountId)
        return { registration: toEventRegistrationView(registration, account) }
      }
      const timestamp = now()
      const saved = await withTransaction(async (session) => {
        const options = { session }
        if (!await eventRepository.requireCategoryIds(event._id, parsed.data.entries.map(({ categoryId }) => categoryId), options)) {
          throw new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: [{ field: 'entries', code: 'invalid_category', message: 'Choose categories from this event.' }] })
        }
        const resolved = await resolveAccountForIdentifier({ accountRepository, displayName: parsed.data.displayName,
          email: parsed.data.email, phone: parsed.data.phone, referredByAccountId: viewer.account._id, now: timestamp, session })
        const existing = await eventRegistrationRepository.findByEventAndAccount(event._id, resolved.account._id, options)
        const registration = existing
          ? existing.status === 'registered'
            ? existing
            : await eventRegistrationRepository.reviveWithEntries(existing._id, viewer.account._id, 'host', parsed.data.entries, timestamp, options)
          : await eventRegistrationRepository.createWithEntries({ eventId: event._id, accountId: resolved.account._id,
            registrationSource: 'host', registeredByAccountId: viewer.account._id, now: timestamp }, parsed.data.entries, options)
        await idempotencyRepository.create({ ...identity, requestDigest, resultReference: { registrationId: registration._id },
          expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        return { registration, ...resolved }
      })
      const { account, provisionalCreated, registration } = saved
      logger?.info({ operation: 'event.participant_add', outcome: 'success', lifecycleStatus: provisionalCreated ? 'provisional' : account.lifecycleStatus }, 'Participant added to event')
      return { registration: toEventRegistrationView(registration, account), provisionalCreated }
    },

    async removeParticipant(rawInput, viewer) {
      const parsed = removeEventParticipantInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      await requireOwner(parsed.data.eventId, viewer)
      const registration = await eventRegistrationRepository.findById(parsed.data.registrationId)
      if (!registration || String(registration.eventId) !== String(parsed.data.eventId)) throw new ApplicationError(ErrorCode.NOT_FOUND)
      const removed = await eventRegistrationRepository.remove(registration._id, now())
      if (!removed) throw new ApplicationError(ErrorCode.CONFLICT)
      const account = await accountRepository.findById(removed.accountId)
      logger?.info({ operation: 'event.participant_remove', outcome: 'success' }, 'Participant removed from event')
      return { registration: toEventRegistrationView(removed, account) }
    },

    async listRegistrations({ eventId }, viewer) {
      await requireOwner(eventId, viewer)
      const rows = await eventRegistrationRepository.listByEvent(eventId, { status: 'registered' })
      return { registrations: await materializeRegistrations(rows) }
    },
  })
}
