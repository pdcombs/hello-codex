import { ObjectId } from 'mongodb'
import { createHash } from 'node:crypto'
import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { validateCategoryBallots, votingWindowStatus } from '../domain/ballot-submission.js'
import { toEventView } from '../domain/event.js'
import { assertAccountEligibility, browserMarkerRequired, codeAccountRequired, provisionalContact } from '../domain/voter-eligibility.js'
import { decryptVotingCode, generateUniqueVotingCodes } from '../domain/voting-access-code.js'
import { accountIsVotingComplete } from '../domain/voter-eligibility.js'
import { requestVotingAccessInputSchema, submitEventBallotInputSchema } from '../domain/validation.js'
import { projectEventEntries } from './event-service.js'

const ballotDigest = (input) => createHash('sha256').update(JSON.stringify({ eventId: input.eventId,
  expectedRulesVersion: input.expectedRulesVersion, expectedVotingStateVersion: input.expectedVotingStateVersion,
  categoryBallots: input.categoryBallots, accessCode: input.accessCode ?? null })).digest('hex')

const projectBallot = (ballot, event = null, entries = []) => ballot ? ({ id: String(ballot._id), eventId: String(ballot.eventId),
  rulesVersion: ballot.rulesVersion, votingStateVersion: ballot.votingStateVersion ?? event?.votingState?.version ?? 1,
  categoryBallots: ballot.categoryBallots.map((category, categoryIndex) => {
    const currentCategory = event?.categories?.find(({ _id }) => String(_id) === String(category.categoryId))
    const selectedEntries = category.entries ?? category.entryIds.map((entryId, selectionOrder) => {
      const currentEntry = entries.find(({ _id }) => String(_id) === String(entryId))
      return { entryId, entryTitle: currentEntry?.title ?? 'Unavailable entry', selectionOrder }
    })
    return { categoryId: String(category.categoryId), categoryTitle: category.categoryTitle ?? currentCategory?.title ?? 'Unavailable category',
      categoryOrder: category.categoryOrder ?? Math.max(0, event?.categories?.indexOf(currentCategory) ?? categoryIndex),
      method: category.method.toUpperCase(), entries: selectedEntries.map((entry) => ({ entryId: String(entry.entryId),
        entryTitle: entry.entryTitle, selectionOrder: entry.selectionOrder })) }
  }), submittedAt: ballot.submittedAt }) : null

export function createEventVotingService({ eventRepository, eventEntryRepository, ballotRepository,
  idempotencyRepository, auditRepository, accountRepository = null, voterAccessRepository = null,
  accessCodeRepository = null, digestCode = null, digestBrowserMarker = null, generateBrowserMarker = null,
  votingCodeEncryptionKey = null, withTransaction, now = () => new Date(), logger = null }) {
  function capability(event) {
    const view = toEventView(event)
    return view.voting
  }
  const requirements = (overrides = {}) => ({ signInRequired: false, completedAccountRequired: false,
    codeRequired: false, mayRetryCode: false, settingsPath: null, ...overrides })
  const decision = (event, code, extra = {}) => ({ decision: code, allowed: code === 'ALLOWED',
    requirements: requirements(extra), rulesVersion: event?.votingRules?.version ?? null,
    votingStateVersion: event?.votingState?.version ?? null })
  return Object.freeze({
    async generateCodes(input, viewer, { correlationId = 'code-generate' } = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(input.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1_000) {
        throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      }
      const identity = { scope: `codes:${event._id}`, operation: 'generateVotingCodes', key: input.idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== String(input.quantity)) throw new ApplicationError(ErrorCode.CONFLICT)
        const records = await accessCodeRepository.listByBatch(event._id, prior.resultReference.batchId)
        return records.map(projectCode)
      }
      const existingCount = await accessCodeRepository.countByEvent(event._id)
      if (existingCount + input.quantity > 100_000) throw new ApplicationError(ErrorCode.CONFLICT)
      const batchId = new ObjectId(); const timestamp = now()
      const generated = await generateUniqueVotingCodes({ eventId: event._id, quantity: input.quantity,
        key: votingCodeEncryptionKey, exists: (digest) => accessCodeRepository.exists(event._id, digest) })
      const documents = generated.map(({ code, ...protectedCode }) => ({ _id: new ObjectId(), eventId: event._id,
        ...protectedCode, status: 'unused', batchId, claimedByAccountId: null, usedByBallotId: null,
        createdByAccountId: viewer.account._id, createdAt: timestamp, usedAt: null, revokedAt: null,
        updatedAt: timestamp, schemaVersion: 1 }))
      await accessCodeRepository.createMany(documents)
      await idempotencyRepository.create({ ...identity, requestDigest: String(input.quantity),
        resultReference: { batchId }, expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp })
      await auditRepository?.append({ name: 'voting.codes_generated', actorAccountId: viewer.account._id,
        subjectType: 'event', subjectId: event._id, outcome: 'success', correlationId,
        metadata: { codeCount: documents.length } })
      logger?.info({ operation: 'voting.code_generate', outcome: 'success', codeCount: documents.length,
        correlationId }, 'Voting codes generated')
      return documents.map((document, index) => projectCode(document, generated[index].code))
    },
    async listCodes({ eventId, first = 50, after = null }, viewer) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      first = Math.max(1, Math.min(first ?? 50, 100))
      const rows = await accessCodeRepository.listByEvent(event._id, { after, limit: Math.min(first + 1, 101) })
      const page = rows.slice(0, first)
      const accounts = accountRepository ? await accountRepository.findByIds(page.flatMap((row) => row.claimedByAccountId ? [row.claimedByAccountId] : [])) : []
      const accountById = new Map(accounts.map((account) => [String(account._id), account]))
      const hasMore = rows.length > first; const nodes = page.map((row) => projectCode(row, null,
        accountById.get(String(row.claimedByAccountId))))
      return { nodes, nextCursor: hasMore ? String(rows[first - 1]._id) : null }
    },
    async capability({ eventId }, viewer = null) {
      const event = await eventRepository.findById(eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      const result = capability(event)
      if (result.votingStatus !== 'OPEN') return result
      if (event.votingRules.defaultCategoryMethod === 'multiple') {
        const entries = await eventEntryRepository.listActiveByEvent(event._id)
        const counts = new Map(event.categories.filter(({ status }) => status !== 'archived')
          .map(({ _id }) => [String(_id), 0]))
        for (const entry of entries) counts.set(String(entry.categoryId), (counts.get(String(entry.categoryId)) ?? 0) + 1)
        if ([...counts.values()].some((count) => count < event.votingRules.defaultMultipleMax)) {
          return { ...result, canVote: false, reasonCode: ErrorCode.INVALID_BALLOT }
        }
      }
      if (event.votingRules.accessPolicy === 'account' && !viewer?.account?._id) {
        return { ...result, canVote: false, reasonCode: ErrorCode.AUTHENTICATION_REQUIRED, hasEventAccess: false }
      }
      if (codeAccountRequired(event.votingRules) && !viewer?.account?._id) {
        return { ...result, canVote: false, reasonCode: ErrorCode.AUTHENTICATION_REQUIRED, hasEventAccess: false }
      }
      if (!viewer?.account?._id) return result
      const ballotCount = await ballotRepository.countByAccount(event._id, viewer.account._id)
      const access = voterAccessRepository ? await voterAccessRepository.find(event._id, viewer.account._id) : null
      const complete = viewer.account.emailNormalized && viewer.account.phoneNormalized
      const needsComplete = event.votingRules.accessPolicy === 'account' || codeAccountRequired(event.votingRules)
      return { ...result, canVote: needsComplete ? Boolean(complete) && ballotCount < event.votingRules.maxBallotsPerAccount : true,
        reasonCode: needsComplete && !complete ? ErrorCode.ACCOUNT_REQUIREMENTS_NOT_MET
          : needsComplete && ballotCount >= event.votingRules.maxBallotsPerAccount ? ErrorCode.BALLOT_LIMIT_REACHED : null,
        remainingBallots: event.votingRules.maxBallotsPerAccount == null ? null
        : Math.max(0, event.votingRules.maxBallotsPerAccount - ballotCount), hasEventAccess: Boolean(access) }
    },
    async requestAccess(rawInput, viewer = null, { browserMarker = null, correlationId = 'voting-access' } = {}) {
      const hadBrowserMarker = Boolean(browserMarker)
      const parsed = requestVotingAccessInputSchema.safeParse(rawInput)
      if (!parsed.success) throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      const input = parsed.data; const event = await eventRepository.findById(input.eventId)
      if (!event || event.lifecycleStatus === 'archived') return { access: decision(event, 'EVENT_UNAVAILABLE'), browserMarker: null }
      if (event.votingRules?.status !== 'configured' || event.votingState?.status !== 'open') {
        return { access: decision(event, 'CLOSED'), browserMarker: null }
      }
      const rules = event.votingRules; const account = viewer?.account ?? null
      if (rules.accessPolicy === 'account') {
        if (!account) return { access: decision(event, 'SIGN_IN_REQUIRED', { signInRequired: true }), browserMarker: null }
        if (!accountIsVotingComplete(account)) return { access: decision(event, 'ACCOUNT_COMPLETION_REQUIRED',
          { completedAccountRequired: true }), browserMarker: null }
        const count = await ballotRepository.countByAccount(event._id, account._id)
        return { access: decision(event, count >= rules.maxBallotsPerAccount ? 'REPEAT_LIMIT_REACHED' : 'ALLOWED'),
          browserMarker: null }
      }
      if (rules.accessPolicy === 'unrestricted') {
        const marker = browserMarker ?? generateBrowserMarker?.(); const markerDigest = digestBrowserMarker?.(marker)
        if (!marker || !markerDigest) throw new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)
        const count = browserMarkerRequired(rules) ? await ballotRepository.countByBrowserMarker(event._id, markerDigest) : 0
        return { access: decision(event, count > 0 ? 'REPEAT_LIMIT_REACHED' : 'ALLOWED'),
          browserMarker: browserMarker ? null : marker }
      }
      let currentAccess = null
      if (codeAccountRequired(rules)) {
        if (!account) return { access: decision(event, 'SIGN_IN_REQUIRED', { signInRequired: true }), browserMarker: null }
        if (!accountIsVotingComplete(account)) return { access: decision(event, 'ACCOUNT_COMPLETION_REQUIRED',
          { completedAccountRequired: true }), browserMarker: null }
        const count = await ballotRepository.countByAccount(event._id, account._id)
        if (count >= rules.maxBallotsPerAccount) return { access: decision(event, 'REPEAT_LIMIT_REACHED'), browserMarker: null }
        currentAccess = await voterAccessRepository.find(event._id, account._id)
      } else {
        const marker = browserMarker ?? generateBrowserMarker?.(); const markerDigest = digestBrowserMarker?.(marker)
        if (!marker || !markerDigest) throw new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)
        currentAccess = await voterAccessRepository.findByBrowser(event._id, markerDigest)
        browserMarker = marker
      }
      const currentBallot = currentAccess?.codeId
        ? await ballotRepository.findByAccessCode(currentAccess.codeId) : null
      if (currentAccess && !currentBallot && !input.accessCode) {
        return { access: decision(event, 'ALLOWED'), browserMarker: account || hadBrowserMarker ? null : browserMarker }
      }
      if (!input.accessCode) {
        if (currentBallot) await auditRepository?.append({ name: 'voting.code_reuse_denied',
          actorAccountId: account?._id ?? null, subjectType: 'votingAccessCode', subjectId: currentAccess.codeId,
          outcome: 'denied', correlationId, metadata: { reasonCode: ErrorCode.ACCESS_CODE_USED } })
        return { access: decision(event, 'CODE_REQUIRED',
          { codeRequired: true, mayRetryCode: true }), browserMarker: hadBrowserMarker ? null : browserMarker }
      }
      const timestamp = now(); const result = await withTransaction(async (session) => {
        const options = session ? { session } : {}
        const current = await eventRepository.findById(event._id, options)
        if (!current || current.lifecycleStatus === 'archived' || current.votingState?.status !== 'open') {
          return decision(current, 'CLOSED')
        }
        const code = await accessCodeRepository.findUnused(current._id, digestCode(current._id, input.accessCode), options)
        if (!code) {
          await auditRepository?.append({ name: 'voting.code_reuse_denied', actorAccountId: account?._id ?? null,
            subjectType: 'event', subjectId: current._id, outcome: 'denied', correlationId,
            metadata: { reasonCode: ErrorCode.ACCESS_CODE_USED } }, options)
          return decision(current, 'CODE_REQUIRED', { codeRequired: true, mayRetryCode: true })
        }
        const markerDigest = account ? null : digestBrowserMarker(browserMarker)
        const consumed = await accessCodeRepository.consume({ codeId: code._id, accountId: account?._id ?? null,
          now: timestamp }, options)
        if (!consumed) return decision(current, 'CODE_REQUIRED', { codeRequired: true, mayRetryCode: true })
        await voterAccessRepository.grant({ eventId: current._id, accountId: account?._id ?? null,
          browserMarkerDigest: markerDigest, source: 'code', codeId: code._id,
          rulesVersion: current.votingRules.version, now: timestamp }, options)
        await auditRepository?.append({ name: 'voting.code_claimed', actorAccountId: account?._id ?? null,
          subjectType: 'votingAccessCode', subjectId: code._id, outcome: 'success', correlationId,
          metadata: { rulesVersion: current.votingRules.version,
            votingStateVersion: current.votingState.version, accessPolicy: 'code' } }, options)
        return decision(current, 'ALLOWED')
      })
      logger?.info({ operation: 'voting.access_request', outcome: result.allowed ? 'success' : 'denied',
        reasonCode: result.decision, correlationId }, 'Voting access evaluated')
      return { access: result, browserMarker: account || hadBrowserMarker ? null : browserMarker }
    },
    async ballotView({ publicId }, viewer = null, { browserMarker = null } = {}) {
      const event = await eventRepository.findByPublicId(publicId)
      if (!event || event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (event.votingRules?.status !== 'configured') throw new ApplicationError(ErrorCode.VOTING_NOT_CONFIGURED)
      if (event.votingState?.status !== 'open') throw new ApplicationError(ErrorCode.VOTING_CLOSED)
      const account = viewer?.account ?? null
      if (event.votingRules.accessPolicy === 'account') {
        if (!account) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
        if (!accountIsVotingComplete(account)) throw new ApplicationError(ErrorCode.ACCOUNT_REQUIREMENTS_NOT_MET)
      }
      let issuedBrowserMarker = null
      if (!account && event.votingRules.accessPolicy === 'unrestricted' && !browserMarker) {
        issuedBrowserMarker = generateBrowserMarker?.()
        browserMarker = issuedBrowserMarker
      }
      const markerDigest = !account && browserMarker ? digestBrowserMarker?.(browserMarker) : null
      if (!account && event.votingRules.accessPolicy === 'unrestricted' && !markerDigest) {
        throw new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)
      }
      if (event.votingRules.accessPolicy === 'code') {
        const access = account ? await voterAccessRepository?.find(event._id, account._id)
          : markerDigest ? await voterAccessRepository?.findByBrowser(event._id, markerDigest) : null
        if (!access) throw new ApplicationError(ErrorCode.INVALID_ACCESS_CODE)
      }
      const ballot = account
        ? await ballotRepository.findLatestByAccount(event._id, account._id)
        : markerDigest ? await ballotRepository.findLatestByBrowserMarker(event._id, markerDigest) : null
      const activeEntries = await eventEntryRepository.listActiveByEvent(event._id)
      const selectedIds = ballot?.categoryBallots.flatMap((category) => category.entryIds ??
        category.entries?.map(({ entryId }) => entryId) ?? []) ?? []
      const historicalEntries = selectedIds.length ? await eventEntryRepository.findByIds(selectedIds) : []
      const allEntries = [...activeEntries, ...historicalEntries.filter((historical) =>
        !activeEntries.some(({ _id }) => String(_id) === String(historical._id)))]
      let eventView = toEventView(event, account?._id ?? null)
      if (accountRepository) {
        const accounts = await accountRepository.findByIds(activeEntries.map(({ ownerAccountId }) => ownerAccountId))
        eventView = projectEventEntries(event, activeEntries, accounts, account?._id ?? null)
      }
      let mayCastAnother = event.votingState?.status === 'open'
      if (ballot) {
        if (event.votingRules.accessPolicy === 'code') {
          mayCastAnother = event.votingState?.status === 'open'
        } else if (event.votingRules.accessPolicy === 'unrestricted') {
          mayCastAnother = mayCastAnother && event.votingRules.unrestrictedRepeatPolicy === 'unlimited'
        } else if (event.votingRules.maxBallotsPerAccount != null) {
          const count = account ? await ballotRepository.countByAccount(event._id, account._id)
            : await ballotRepository.countByBrowserMarker(event._id, markerDigest)
          mayCastAnother = mayCastAnother && count < event.votingRules.maxBallotsPerAccount
        } else mayCastAnother = false
      }
      return { event: eventView, submittedBallot: projectBallot(ballot, event, allEntries), mayCastAnother,
        browserMarker: issuedBrowserMarker }
    },
    async submit(rawInput, viewer, { correlationId = 'ballot-submit' } = {}) {
      const parsed = submitEventBallotInputSchema.safeParse(rawInput)
      if (!parsed.success) throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      const input = parsed.data
      const timestamp = now()
      return withTransaction(async (session) => {
        const options = session ? { session } : {}
        const event = await eventRepository.findById(input.eventId, options)
        if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
        if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
        const status = votingWindowStatus(event.votingRules, timestamp, event.votingState)
        if (status === 'NOT_CONFIGURED') throw new ApplicationError(ErrorCode.VOTING_NOT_CONFIGURED)
        if (status === 'UPCOMING') throw new ApplicationError(ErrorCode.VOTING_NOT_OPEN)
        if (status === 'CLOSED') throw new ApplicationError(ErrorCode.VOTING_CLOSED)
        if (input.expectedRulesVersion !== event.votingRules.version) throw new ApplicationError(ErrorCode.RULES_CHANGED)
        if (input.expectedVotingStateVersion !== event.votingState.version) throw new ApplicationError(ErrorCode.CONFLICT)
        const identity = { scope: `ballot:${event._id}`, operation: 'submitEventBallot', key: input.idempotencyKey }
        const requestDigest = ballotDigest(input)
        const prior = await idempotencyRepository.find(identity, options)
        if (prior) {
          if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
          const priorBallot = await ballotRepository.findById(prior.resultReference.receipt.id, options)
          const entries = await eventEntryRepository.listActiveByEvent(event._id, options)
          return { receipt: prior.resultReference.receipt, ballot: projectBallot(priorBallot, event, entries), capability: capability(event) }
        }
        let account = viewer?.account ?? null
        let accessCode = null
        let grantedAccessCodeId = null
        let browserMarker = null
        let browserMarkerDigest = null
        if (event.votingRules.accessPolicy === 'account') {
          const count = account ? await ballotRepository.countByAccount(event._id, account._id, options) : 0
          assertAccountEligibility({ rules: event.votingRules, account, ballotCount: count })
        } else if (event.votingRules.accessPolicy === 'code') {
          const markerDigest = !account && input.browserMarker ? digestBrowserMarker?.(input.browserMarker) : null
          const existingAccess = voterAccessRepository ? (account
            ? await voterAccessRepository.find(event._id, account._id, options)
            : markerDigest ? await voterAccessRepository.findByBrowser(event._id, markerDigest, options) : null) : null
          if (existingAccess?.codeId && await ballotRepository.findByAccessCode(existingAccess.codeId, options)) {
            await auditRepository?.append({ name: 'voting.code_reuse_denied', actorAccountId: account?._id ?? null,
              subjectType: 'votingAccessCode', subjectId: existingAccess.codeId, outcome: 'denied', correlationId,
              metadata: { reasonCode: ErrorCode.ACCESS_CODE_USED } }, options)
            throw new ApplicationError(ErrorCode.ACCESS_CODE_USED)
          }
          if (account && existingAccess) grantedAccessCodeId = existingAccess.codeId
          if (!account && existingAccess) {
            browserMarker = input.browserMarker
            browserMarkerDigest = markerDigest
            grantedAccessCodeId = existingAccess.codeId
          }
          if (!existingAccess) {
            if (!input.accessCode || !accessCodeRepository || !digestCode) throw new ApplicationError(ErrorCode.INVALID_ACCESS_CODE)
            accessCode = await accessCodeRepository.findUnused(event._id, digestCode(event._id, input.accessCode), options)
            if (!accessCode) throw new ApplicationError(ErrorCode.INVALID_ACCESS_CODE)
            if (codeAccountRequired(event.votingRules)) {
              assertAccountEligibility({ rules: event.votingRules, account, ballotCount: 0 })
            } else if (!account) {
              const contact = provisionalContact(input.provisionalVoter)
              account = await accountRepository.findByEmailNormalized(contact.emailNormalized, options)
                ?? await accountRepository.createProvisional({ ...contact, referredByAccountId: null, now: timestamp }, options)
            }
          }
          if (account && event.votingRules.maxBallotsPerAccount != null) {
            const count = await ballotRepository.countByAccount(event._id, account._id, options)
            if (count >= event.votingRules.maxBallotsPerAccount) throw new ApplicationError(ErrorCode.BALLOT_LIMIT_REACHED)
          }
        } else if (event.votingRules.accessPolicy === 'unrestricted') {
          browserMarker = input.browserMarker ?? generateBrowserMarker?.()
          browserMarkerDigest = digestBrowserMarker?.(browserMarker)
          if (!browserMarker || !browserMarkerDigest) throw new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)
          if (browserMarkerRequired(event.votingRules)) {
            const count = await ballotRepository.countByBrowserMarker(event._id, browserMarkerDigest, options)
            if (count > 0) throw new ApplicationError(ErrorCode.BALLOT_LIMIT_REACHED)
          }
        }
        const entries = await eventEntryRepository.listActiveByEvent(event._id, options)
        let categoryBallots
        try { categoryBallots = validateCategoryBallots({ event, entries, categoryBallots: input.categoryBallots }) }
        catch (error) { throw new ApplicationError(ErrorCode.INVALID_BALLOT, { cause: error }) }
        const ballot = { _id: new ObjectId(), eventId: event._id, accountId: account?._id ?? null,
          accessCodeId: accessCode?._id ?? grantedAccessCodeId ?? null, browserMarkerDigest, rulesVersion: event.votingRules.version,
          votingStateVersion: event.votingState.version,
          accessPolicy: event.votingRules.accessPolicy, categoryBallots, submittedAt: timestamp,
          createdAt: timestamp, schemaVersion: 2 }
        try { await ballotRepository.create(ballot, options) }
        catch (error) {
          if (error?.code === 11000 && (error?.keyPattern?.accessCodeId || ballot.accessCodeId)) {
            await auditRepository?.append({ name: 'voting.code_reuse_denied', actorAccountId: account?._id ?? null,
              subjectType: 'votingAccessCode', subjectId: ballot.accessCodeId, outcome: 'denied', correlationId,
              metadata: { reasonCode: ErrorCode.ACCESS_CODE_USED } }, options)
            throw new ApplicationError(ErrorCode.ACCESS_CODE_USED)
          }
          if (error?.code === 11000 && browserMarkerDigest) throw new ApplicationError(ErrorCode.BALLOT_LIMIT_REACHED)
          throw error
        }
        if (accessCode) {
          const consumed = await accessCodeRepository.consume({ codeId: accessCode._id, accountId: account._id,
            ballotId: ballot._id, now: timestamp }, options)
          if (!consumed) {
            logger?.warn({ operation: 'voting.code_consume', outcome: 'conflict',
              errorCode: ErrorCode.INVALID_ACCESS_CODE, correlationId }, 'Voting code claim conflict')
            throw new ApplicationError(ErrorCode.INVALID_ACCESS_CODE)
          }
          await auditRepository?.append({ name: 'voting.code_consumed', actorAccountId: account._id,
            subjectType: 'votingAccessCode', subjectId: accessCode._id, outcome: 'success', correlationId,
            metadata: { rulesVersion: event.votingRules.version } }, options)
          logger?.info({ operation: 'voting.code_consume', outcome: 'success', correlationId },
            'Voting code consumed')
        } else if (grantedAccessCodeId) {
          const attached = await accessCodeRepository.attachBallot({ codeId: grantedAccessCodeId,
            ballotId: ballot._id, now: timestamp }, options)
          if (!attached) throw new ApplicationError(ErrorCode.ACCESS_CODE_USED)
          await auditRepository?.append({ name: 'voting.code_ballot_attached', actorAccountId: account?._id ?? null,
            subjectType: 'votingAccessCode', subjectId: grantedAccessCodeId, outcome: 'success', correlationId,
            metadata: { rulesVersion: event.votingRules.version } }, options)
        }
        if (event.votingRules.accessPolicy === 'code' && account && voterAccessRepository) {
          await voterAccessRepository.grant({ eventId: event._id, accountId: account._id, source: 'code',
            codeId: accessCode?._id ?? grantedAccessCodeId, rulesVersion: event.votingRules.version, now: timestamp }, options)
          await auditRepository?.append({ name: 'event.voter_access_granted', actorAccountId: account._id,
            subjectType: 'eventVoterAccess', subjectId: `${event._id}:${account._id}`, outcome: 'success',
            correlationId, metadata: { accessPolicy: 'code' } }, options)
        }
        const receipt = { id: String(ballot._id), eventId: String(event._id), rulesVersion: ballot.rulesVersion,
          submittedAt: timestamp }
        await idempotencyRepository.create({ ...identity, requestDigest,
          resultReference: { receipt }, expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        await auditRepository?.append({ name: 'voting.ballot_submitted', actorAccountId: viewer?.account?._id ?? null,
          subjectType: 'ballotSubmission', subjectId: ballot._id, outcome: 'success', correlationId,
          metadata: { rulesVersion: ballot.rulesVersion, categoryCount: categoryBallots.length } }, options)
        logger?.info({ operation: 'voting.ballot_submit', outcome: 'success', rulesVersion: ballot.rulesVersion,
          categoryCount: categoryBallots.length, correlationId }, 'Ballot submitted')
        return { receipt, ballot: projectBallot(ballot, event, entries), capability: capability(event), browserMarker }
      })
    },
  })

  function projectCode(document, rawCode = null, claimant = null) {
    return { id: String(document._id), code: rawCode ?? decryptVotingCode({ ...document, key: votingCodeEncryptionKey }),
      status: document.status.toUpperCase(), claimantAccountId: document.claimedByAccountId ? String(document.claimedByAccountId) : null,
      claimantDisplayName: claimant?.displayName ?? null, claimantEmail: claimant?.emailNormalized ?? null,
      createdAt: document.createdAt, usedAt: document.usedAt }
  }
}
