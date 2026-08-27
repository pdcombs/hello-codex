import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { transitionVotingState } from '../domain/event-voting-state.js'
import { setEventVotingStatusInputSchema } from '../domain/validation.js'
import { toEventView } from '../domain/event.js'

function invalid(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: error.issues.map((issue) => ({
    field: String(issue.path[0] ?? 'input'), code: issue.code, message: issue.message,
  })) })
}

export function createEventVotingStateService({ eventRepository, eventEntryRepository, accessCodeRepository,
  auditRepository, now = () => new Date(), logger = null }) {
  return Object.freeze({
    async setStatus(rawInput, viewer, { correlationId = 'voting-state' } = {}) {
      const parsed = setEventVotingStatusInputSchema.safeParse(rawInput)
      if (!parsed.success) throw invalid(parsed.error)
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const startedAt = process.hrtime.bigint(); const input = parsed.data
      const event = await eventRepository.findById(input.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
      if (input.status === 'OPEN') {
        if (event.votingRules?.status !== 'configured') throw new ApplicationError(ErrorCode.VOTING_NOT_CONFIGURED)
        const entries = await eventEntryRepository.listActiveByEvent(event._id)
        if (!entries.length) throw new ApplicationError(ErrorCode.CONFLICT)
      }
      if (input.expectedVersion !== event.votingState.version || input.status.toLowerCase() === event.votingState.status) {
        throw new ApplicationError(ErrorCode.CONFLICT)
      }
      const timestamp = now(); const votingState = transitionVotingState(event.votingState, input.status,
        { ownerAccountId: viewer.account._id, now: timestamp })
      const updated = await eventRepository.transitionVotingState(event._id, viewer.account._id,
        input.expectedVersion, event.votingState.status, votingState)
      if (!updated) throw new ApplicationError(ErrorCode.CONFLICT)
      const unusedCount = input.status === 'OPEN' && event.votingRules.accessPolicy === 'code'
        ? await accessCodeRepository.countUnusedByEvent(event._id) : null
      const hasUnusedCodes = unusedCount == null ? null : unusedCount > 0
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
      await auditRepository?.append({ name: input.status === 'OPEN' ? 'voting.state_opened' : 'voting.state_closed',
        actorAccountId: viewer.account._id, subjectType: 'event', subjectId: event._id, outcome: 'success', correlationId,
        metadata: { votingStateVersion: votingState.version,
          ...(hasUnusedCodes == null ? {} : { hasUnusedCodes }) } })
      logger?.info({ operation: 'voting.state_change', outcome: 'success', requestedStatus: input.status,
        votingStateVersion: votingState.version, durationMs, correlationId }, 'Voting state changed')
      return { event: toEventView(updated, viewer.account._id), hasUnusedCodes }
    },
  })
}
