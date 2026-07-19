import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { toEntryView, toEntryOwnerChoice, toParticipantCard } from '../domain/event-entry.js'
import { normalizeEmail, normalizePhone, digestIdempotencyRequest } from '../domain/security.js'
import {
  addEventParticipantInputSchema,
  archiveEventEntryInputSchema,
  archiveEventParticipantEntriesInputSchema,
  createEventEntryInputSchema,
  entryOwnerChoicesInputSchema,
  registerForEventInputSchema,
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

export function createEventEntryService({
  eventRepository,
  eventEntryRepository,
  accountRepository,
  idempotencyRepository,
  eventAccessService = null,
  digestRequest = digestIdempotencyRequest,
  withTransaction = async (operation) => operation(null),
  now = () => new Date(),
  logger,
}) {
  async function requireOwner(eventId, viewer, options = {}) {
    if (eventAccessService) return eventAccessService.requireManager(eventId, viewer, options)
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = await eventRepository.findById(eventId, options)
    if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
    if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
    return event
  }

  async function resolveParticipant(entries) {
    if (entries.length === 0) return null
    const account = await accountRepository.findById(entries[0].ownerAccountId)
    return account ? toParticipantCard(entries.filter(({ status }) => status === 'active'), account) : null
  }

  async function creationResult(entries, account, participantEntries = entries) {
    return {
      createdEntries: entries.map((entry) => toEntryView(entry, account)),
      affectedParticipant: toParticipantCard(participantEntries, account),
    }
  }

  async function createEntries({ input, viewer, self }) {
    const schema = self ? registerForEventInputSchema : addEventParticipantInputSchema
    const parsed = schema.safeParse(input)
    if (!parsed.success) throw validationError(parsed.error)
    if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
    const event = self
      ? await eventRepository.findById(parsed.data.eventId)
      : await requireOwner(parsed.data.eventId, viewer)
    if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
    if (self && viewer.account.verificationStatus !== 'verified') throw new ApplicationError(ErrorCode.EMAIL_NOT_VERIFIED)
    if (self && event.registrationPolicy !== 'open') throw new ApplicationError(ErrorCode.FORBIDDEN)
    const operation = self ? 'registerForEventEntries' : 'addEventParticipantEntries'
    const identity = { scope: `${viewer.account._id}:${event._id}`, operation, key: parsed.data.idempotencyKey }
    const requestDigest = digestRequest(parsed.data)
    const prior = await idempotencyRepository.find(identity)
    if (prior) {
      if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
      const entries = await eventEntryRepository.findByIds(prior.resultReference.entryIds)
      const account = await accountRepository.findById(entries[0].ownerAccountId)
      const participantEntries = await eventEntryRepository.listActiveByEventAndOwner(event._id, account._id)
      return creationResult(entries, account, participantEntries)
    }
    const timestamp = now()
    const saved = await withTransaction(async (session) => {
      const options = session ? { session } : {}
      if (!await eventRepository.requireCategoryIds(event._id, parsed.data.entries.map(({ categoryId }) => categoryId), options)) {
        throw new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: [{ field: 'entries',
          code: 'invalid_category', message: 'Choose categories from this event.' }] })
      }
      let account = viewer.account
      if (!self) {
        const emailNormalized = normalizeEmail(parsed.data.email)
        account = await accountRepository.findByEmailNormalized(emailNormalized, options)
        if (!account) account = await accountRepository.createProvisional({
          emailNormalized, phoneNormalized: parsed.data.phone ?? null, displayName: parsed.data.displayName,
          referredByAccountId: viewer.account._id, now: timestamp,
        }, options)
      }
      const entries = await eventEntryRepository.createMany({
        eventId: event._id, ownerAccountId: account._id, createdByAccountId: viewer.account._id,
        entries: parsed.data.entries, now: timestamp,
      }, options)
      await idempotencyRepository.create({ ...identity, requestDigest,
        resultReference: { entryIds: entries.map(({ _id }) => _id) },
        expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
      return { entries, account }
    })
    logger?.info({ operation: self ? 'event.self_entry_create' : 'event.participant_entries_create',
      outcome: 'success', entryCount: saved.entries.length }, 'Event entries created')
    const participantEntries = await eventEntryRepository.listActiveByEventAndOwner(event._id, saved.account._id)
    return creationResult(saved.entries, saved.account, participantEntries)
  }

  function normalizeSearch(search) {
    if (/[a-z@]/i.test(search)) return { type: 'email', prefix: normalizeEmail(search) }
    const digits = search.replace(/\D/g, '')
    const prefix = search.trim().startsWith('+') || digits.startsWith('1') ? `+${digits}` : `+1${digits}`
    return { type: 'phone', prefix }
  }

  async function choicesForAccounts(eventId, accounts) {
    const recent = await eventEntryRepository.latestActiveByEventAndOwners(eventId, accounts.map(({ _id }) => _id))
    const recentByAccount = new Map(recent.map((item) => [String(item.ownerAccountId), item.latestEntryCreatedAt]))
    return accounts.map((account) => toEntryOwnerChoice(account, {
      latestEntryCreatedAt: recentByAccount.get(String(account._id)) ?? null,
    }))
  }

  async function resolveProvisionalOwner(input, viewer, timestamp, options) {
    const emailNormalized = input.email ? normalizeEmail(input.email) : null
    const phoneNormalized = input.phone ? normalizePhone(input.phone) : null
    const [emailAccount, phoneAccount] = await Promise.all([
      emailNormalized ? accountRepository.findByEmailNormalized(emailNormalized, options) : null,
      phoneNormalized ? accountRepository.findByPhoneNormalized(phoneNormalized, options) : null,
    ])
    if (emailAccount && phoneAccount && String(emailAccount._id) !== String(phoneAccount._id)) {
      throw new ApplicationError(ErrorCode.CONFLICT, { exposeMessage: true,
        internalMessage: 'Email and phone belong to different accounts.' })
    }
    const existing = emailAccount ?? phoneAccount
    if (existing) return { account: existing, provisionalCreated: false }
    const account = await accountRepository.createProvisional({
      displayName: input.displayName,
      emailNormalized,
      phoneNormalized,
      referredByAccountId: viewer.account._id,
      now: timestamp,
    }, options)
    return { account, provisionalCreated: true }
  }

  return Object.freeze({
    registerForEvent(input, viewer) {
      return createEntries({ input, viewer, self: true })
    },
    addParticipant(input, viewer) {
      return createEntries({ input, viewer, self: false })
    },
    async entryOwnerChoices(input, viewer) {
      const parsed = entryOwnerChoicesInputSchema.safeParse(input)
      if (!parsed.success) throw validationError(parsed.error)
      const startedAt = process.hrtime.bigint()
      await requireOwner(parsed.data.eventId, viewer)
      let choices
      let mode
      if (parsed.data.search) {
        mode = 'search'
        const { type, prefix } = normalizeSearch(parsed.data.search)
        const accounts = await accountRepository.searchByContactPrefix({ type, prefix, limit: parsed.data.first })
        choices = await choicesForAccounts(parsed.data.eventId, accounts)
      } else {
        mode = 'recent'
        const recent = await eventEntryRepository.listRecentOwners(parsed.data.eventId, parsed.data.first)
        const accounts = await accountRepository.findByIds(recent.map(({ ownerAccountId }) => ownerAccountId))
        const accountById = new Map(accounts.map((account) => [String(account._id), account]))
        choices = recent.flatMap((item) => {
          const account = accountById.get(String(item.ownerAccountId))
          return account ? [toEntryOwnerChoice(account, { latestEntryCreatedAt: item.latestEntryCreatedAt })] : []
        })
      }
      logger?.info({ operation: 'entry.owner_choices_read', outcome: 'success', mode,
        resultCount: choices.length, durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000 },
      'Entry owner choices projected')
      return { choices }
    },
    async createEntry(input, viewer) {
      const parsed = createEventEntryInputSchema.safeParse(input)
      if (!parsed.success) throw validationError(parsed.error)
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const identity = { scope: `${viewer.account._id}:${parsed.data.eventId}`,
        operation: 'createEventEntry', key: parsed.data.idempotencyKey }
      const requestDigest = digestRequest(parsed.data)
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const entries = await eventEntryRepository.findByIds(prior.resultReference.entryIds)
        const account = await accountRepository.findById(prior.resultReference.accountId ?? entries[0]?.ownerAccountId)
        const participantEntries = await eventEntryRepository.listActiveByEventAndOwner(parsed.data.eventId, account._id)
        return { ...(await creationResult(entries, account, participantEntries)),
          provisionalCreated: Boolean(prior.resultReference.provisionalCreated) }
      }
      const startedAt = process.hrtime.bigint()
      const timestamp = now()
      const saved = await withTransaction(async (session) => {
        const options = session ? { session } : {}
        const event = await requireOwner(parsed.data.eventId, viewer, options)
        if (!await eventRepository.requireCategoryIds(event._id, [parsed.data.categoryId], options)) {
          throw new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: [{ field: 'categoryId',
            code: 'invalid_category', message: 'Choose a category from this event.' }] })
        }
        let owner
        let provisionalCreated = false
        if (parsed.data.accountId) {
          owner = await accountRepository.findById(parsed.data.accountId, options)
          if (!owner) throw new ApplicationError(ErrorCode.NOT_FOUND)
        } else {
          ({ account: owner, provisionalCreated } = await resolveProvisionalOwner(
            parsed.data.provisionalOwner, viewer, timestamp, options))
        }
        const entries = await eventEntryRepository.createMany({
          eventId: event._id,
          ownerAccountId: owner._id,
          createdByAccountId: viewer.account._id,
          entries: [{ categoryId: parsed.data.categoryId, title: parsed.data.title }],
          now: timestamp,
        }, options)
        await idempotencyRepository.create({ ...identity, requestDigest,
          resultReference: { entryIds: entries.map(({ _id }) => _id), accountId: owner._id, provisionalCreated },
          expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        return { entries, owner, provisionalCreated }
      })
      const participantEntries = await eventEntryRepository.listActiveByEventAndOwner(
        parsed.data.eventId, saved.owner._id)
      logger?.info({ operation: 'event.entry_create', outcome: 'success', entryCount: 1,
        lifecycle: saved.provisionalCreated ? 'provisional' : 'existing',
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000 }, 'Event entry created')
      return { ...(await creationResult(saved.entries, saved.owner, participantEntries)),
        provisionalCreated: saved.provisionalCreated }
    },
    async listParticipants({ eventId }, viewer) {
      await requireOwner(eventId, viewer)
      const startedAt = process.hrtime.bigint()
      const entries = await eventEntryRepository.listActiveByEvent(eventId)
      const accountIds = [...new Map(entries.map((entry) => [String(entry.ownerAccountId), entry.ownerAccountId])).values()]
      const accounts = await accountRepository.findByIds(accountIds)
      const accountById = new Map(accounts.map((account) => [String(account._id), account]))
      const grouped = new Map()
      for (const entry of entries) {
        const key = String(entry.ownerAccountId)
        grouped.set(key, [...(grouped.get(key) ?? []), entry])
      }
      const participants = [...grouped].map(([accountId, owned]) => toParticipantCard(owned, accountById.get(accountId)))
      logger?.info({ operation: 'event.participants_read', outcome: 'success', participantCount: participants.length,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000 }, 'Event participants projected')
      return { participants }
    },
    async archiveEntry(input, viewer) {
      const parsed = archiveEventEntryInputSchema.safeParse(input)
      if (!parsed.success) throw validationError(parsed.error)
      await requireOwner(parsed.data.eventId, viewer)
      const identity = { scope: `${viewer.account._id}:${parsed.data.eventId}`,
        operation: 'archiveEventEntry', key: parsed.data.idempotencyKey }
      const requestDigest = digestRequest(parsed.data)
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const remaining = await eventEntryRepository.listActiveByEventAndOwner(parsed.data.eventId, prior.resultReference.accountId)
        return { archivedEntryIds: prior.resultReference.entryIds.map(String),
          affectedParticipant: await resolveParticipant(remaining) }
      }
      const timestamp = now()
      const archived = await withTransaction(async (session) => {
        const options = session ? { session } : {}
        const entry = await eventEntryRepository.archiveOne({ eventId: parsed.data.eventId,
          entryId: parsed.data.entryId, archivedByAccountId: viewer.account._id, now: timestamp }, options)
        if (!entry) throw new ApplicationError(ErrorCode.CONFLICT)
        await idempotencyRepository.create({ ...identity, requestDigest,
          resultReference: { entryIds: [entry._id], accountId: entry.ownerAccountId },
          expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        return entry
      })
      const remaining = await eventEntryRepository.listActiveByEventAndOwner(parsed.data.eventId, archived.ownerAccountId)
      return { archivedEntryIds: [String(archived._id)], affectedParticipant: await resolveParticipant(remaining) }
    },
    async archiveParticipantEntries(input, viewer) {
      const parsed = archiveEventParticipantEntriesInputSchema.safeParse(input)
      if (!parsed.success) throw validationError(parsed.error)
      await requireOwner(parsed.data.eventId, viewer)
      const identity = { scope: `${viewer.account._id}:${parsed.data.eventId}`,
        operation: 'archiveEventParticipantEntries', key: parsed.data.idempotencyKey }
      const requestDigest = digestRequest(parsed.data)
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        return { archivedEntryIds: prior.resultReference.entryIds.map(String), affectedParticipant: null }
      }
      const timestamp = now()
      const archived = await withTransaction(async (session) => {
        const options = session ? { session } : {}
        const entries = await eventEntryRepository.archiveByOwner({ eventId: parsed.data.eventId,
          ownerAccountId: parsed.data.accountId, archivedByAccountId: viewer.account._id, now: timestamp }, options)
        if (entries.length === 0) throw new ApplicationError(ErrorCode.CONFLICT)
        await idempotencyRepository.create({ ...identity, requestDigest,
          resultReference: { entryIds: entries.map(({ _id }) => _id), accountId: parsed.data.accountId },
          expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        return entries
      })
      return { archivedEntryIds: archived.map(({ _id }) => String(_id)), affectedParticipant: null }
    },
  })
}
