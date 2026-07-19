import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { configureVotingRules } from '../domain/event-voting-rules.js'
import { toEventView } from '../domain/event.js'

export function createEventVotingRulesService({ eventRepository, auditRepository = null, now = () => new Date(), logger = null }) {
  return Object.freeze({
    async updateRules(input, viewer, { correlationId = 'voting-rules-update' } = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(input.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      if (new Date(event.updatedAt).getTime() !== new Date(input.expectedEventUpdatedAt).getTime()) {
        throw new ApplicationError(ErrorCode.CONFLICT)
      }
      let votingRules
      try {
        votingRules = configureVotingRules(event.votingRules, input, {
          ownerAccountId: viewer.account._id,
          categoryIds: event.categories.filter(({ status }) => status !== 'archived').map(({ _id }) => _id),
          now: now(),
        })
      } catch (error) {
        if (error.message === 'RULES_CHANGED') throw new ApplicationError(ErrorCode.RULES_CHANGED)
        throw new ApplicationError(ErrorCode.VALIDATION_FAILED, { cause: error,
          fieldErrors: [{ field: 'input', code: 'invalid', message: error.message }] })
      }
      const saved = await eventRepository.updateVotingRules(event._id, viewer.account._id, event.updatedAt,
        input.expectedRulesVersion, votingRules)
      if (!saved) throw new ApplicationError(ErrorCode.CONFLICT)
      await auditRepository?.append({ name: 'event.voting_rules_updated', actorAccountId: viewer.account._id,
        subjectType: 'event', subjectId: event._id, outcome: 'success', correlationId,
        metadata: { rulesVersion: votingRules.version, accessPolicy: votingRules.accessPolicy } })
      logger?.info({ operation: 'event.rules_update', outcome: 'success', rulesVersion: votingRules.version,
        accessPolicy: votingRules.accessPolicy, correlationId }, 'Event voting rules updated')
      return { event: toEventView(saved, viewer.account._id) }
    },
  })
}
