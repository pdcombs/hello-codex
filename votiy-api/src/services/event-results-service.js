import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { calculateVotingResults } from '../domain/voting-results.js'
import { toEventView } from '../domain/event.js'

export function createEventResultsService({ eventRepository, eventEntryRepository, ballotRepository,
  eventService = null, auditRepository = null, now = () => new Date(), logger = null }) {
  return Object.freeze({
    async results({ publicId }, viewer, { correlationId = 'event-results' } = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findByPublicId(publicId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) {
        logger?.warn({ operation: 'voting.results_view', outcome: 'denied', errorCode: ErrorCode.FORBIDDEN,
          correlationId }, 'Voting results access denied')
        throw new ApplicationError(ErrorCode.FORBIDDEN)
      }
      const [entries, ballots] = await Promise.all([
        eventEntryRepository.listByEvent(event._id), ballotRepository.listByEvent(event._id),
      ])
      const calculatedAt = now()
      const totals = calculateVotingResults({ event, entries, ballots, calculatedAt })
      const eventView = eventService ? (await eventService.eventByPublicId({ publicId, viewer })).event
        : toEventView(event, viewer.account._id)
      await auditRepository?.append({ name: 'voting.results_viewed', actorAccountId: viewer.account._id,
        subjectType: 'event', subjectId: event._id, outcome: 'success', correlationId,
        metadata: { ballotCount: totals.votesReceived, categoryCount: totals.categories.length } })
      logger?.info({ operation: 'voting.results_view', outcome: 'success', ballotCount: totals.votesReceived,
        categoryCount: totals.categories.length, correlationId }, 'Voting results viewed')
      return { event: eventView, ...totals }
    },
  })
}
