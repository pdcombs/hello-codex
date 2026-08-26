import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { configureVotingRules } from '../domain/event-voting-rules.js'
import { toEventView } from '../domain/event.js'

export function createEventVotingRulesService({ eventRepository, eventEntryRepository = null,
  auditRepository = null, now = () => new Date(), logger = null }) {
  return Object.freeze({
    async updateRules(input, viewer, { correlationId = 'voting-rules-update' } = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(input.eventId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
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
        if (votingRules.defaultCategoryMethod === 'multiple' && eventEntryRepository) {
          const entries = await eventEntryRepository.listActiveByEvent(event._id)
          const counts = new Map(event.categories.filter(({ status }) => status !== 'archived')
            .map(({ _id }) => [String(_id), 0]))
          for (const entry of entries) counts.set(String(entry.categoryId), (counts.get(String(entry.categoryId)) ?? 0) + 1)
          const blocked = [...counts.entries()].filter(([, count]) => count < votingRules.defaultMultipleMax)
          if (blocked.length) throw new TypeError('Every active category needs enough entries for the maximum selections')
        }
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
