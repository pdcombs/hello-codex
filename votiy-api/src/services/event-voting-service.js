import { ObjectId } from 'mongodb'
import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { validateCategoryBallots, votingWindowStatus } from '../domain/ballot-submission.js'
import { toEventView } from '../domain/event.js'
import { assertAccountEligibility, browserMarkerRequired, codeAccountRequired, provisionalContact } from '../domain/voter-eligibility.js'
import { decryptVotingCode, generateUniqueVotingCodes } from '../domain/voting-access-code.js'

export function createEventVotingService({ eventRepository, eventEntryRepository, ballotRepository,
  idempotencyRepository, auditRepository, accountRepository = null, voterAccessRepository = null,
  accessCodeRepository = null, digestCode = null, digestBrowserMarker = null, generateBrowserMarker = null,
  votingCodeEncryptionKey = null, withTransaction, now = () => new Date(), logger = null }) {
  function capability(event) {
    const view = toEventView(event)
    return view.voting
  }
  return Object.freeze({
    async generateCodes(input, viewer, { correlationId = 'code-generate' } = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(input.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
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
    async submit(input, viewer, { correlationId = 'ballot-submit' } = {}) {
      const timestamp = now()
      return withTransaction(async (session) => {
        const options = session ? { session } : {}
        const event = await eventRepository.findById(input.eventId, options)
        if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
        const status = votingWindowStatus(event.votingRules, timestamp)
        if (status === 'NOT_CONFIGURED') throw new ApplicationError(ErrorCode.VOTING_NOT_CONFIGURED)
        if (status === 'UPCOMING') throw new ApplicationError(ErrorCode.VOTING_NOT_OPEN)
        if (status === 'CLOSED') throw new ApplicationError(ErrorCode.VOTING_CLOSED)
        if (input.expectedRulesVersion !== event.votingRules.version) throw new ApplicationError(ErrorCode.RULES_CHANGED)
        let account = viewer?.account ?? null
        let accessCode = null
        let browserMarker = null
        let browserMarkerDigest = null
        if (event.votingRules.accessPolicy === 'account') {
          const count = account ? await ballotRepository.countByAccount(event._id, account._id, options) : 0
          assertAccountEligibility({ rules: event.votingRules, account, ballotCount: count })
        } else if (event.votingRules.accessPolicy === 'code') {
          const existingAccess = account && voterAccessRepository
            ? await voterAccessRepository.find(event._id, account._id, options) : null
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
        } else if (browserMarkerRequired(event.votingRules)) {
          browserMarker = input.browserMarker ?? generateBrowserMarker?.()
          browserMarkerDigest = digestBrowserMarker?.(browserMarker)
          if (!browserMarker || !browserMarkerDigest) throw new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)
        }
        const entries = await eventEntryRepository.listActiveByEvent(event._id, options)
        let categoryBallots
        try { categoryBallots = validateCategoryBallots({ event, entries, categoryBallots: input.categoryBallots }) }
        catch (error) { throw new ApplicationError(ErrorCode.INVALID_BALLOT, { cause: error }) }
        const identity = { scope: `ballot:${event._id}`, operation: 'submitEventBallot', key: input.idempotencyKey }
        const prior = await idempotencyRepository.find(identity, options)
        if (prior) return { receipt: prior.resultReference.receipt, capability: capability(event) }
        const ballot = { _id: new ObjectId(), eventId: event._id, accountId: account?._id ?? null,
          accessCodeId: accessCode?._id ?? null, browserMarkerDigest, rulesVersion: event.votingRules.version,
          accessPolicy: event.votingRules.accessPolicy, categoryBallots, submittedAt: timestamp,
          createdAt: timestamp, schemaVersion: 1 }
        try { await ballotRepository.create(ballot, options) }
        catch (error) {
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
        }
        if (event.votingRules.accessPolicy === 'code' && account && voterAccessRepository) {
          await voterAccessRepository.grant({ eventId: event._id, accountId: account._id, source: 'code',
            codeId: accessCode?._id ?? null, now: timestamp }, options)
          await auditRepository?.append({ name: 'event.voter_access_granted', actorAccountId: account._id,
            subjectType: 'eventVoterAccess', subjectId: `${event._id}:${account._id}`, outcome: 'success',
            correlationId, metadata: { accessPolicy: 'code' } }, options)
        }
        const receipt = { id: String(ballot._id), eventId: String(event._id), rulesVersion: ballot.rulesVersion,
          submittedAt: timestamp }
        await idempotencyRepository.create({ ...identity, requestDigest: input.idempotencyKey,
          resultReference: { receipt }, expiresAt: new Date(timestamp.getTime() + 86_400_000), createdAt: timestamp }, options)
        await auditRepository?.append({ name: 'voting.ballot_submitted', actorAccountId: viewer?.account?._id ?? null,
          subjectType: 'ballotSubmission', subjectId: ballot._id, outcome: 'success', correlationId,
          metadata: { rulesVersion: ballot.rulesVersion, categoryCount: categoryBallots.length } }, options)
        logger?.info({ operation: 'voting.ballot_submit', outcome: 'success', rulesVersion: ballot.rulesVersion,
          categoryCount: categoryBallots.length, correlationId }, 'Ballot submitted')
        return { receipt, capability: capability(event), browserMarker }
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
