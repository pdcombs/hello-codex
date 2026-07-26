import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { EVENT_VISIBILITIES, eventDetailAccess, privateEventSummary } from '../domain/event-visibility.js'
import { deriveEventAnalytics } from '../domain/event-analytics.js'
import { toEventView } from '../domain/event.js'

export function createEventVisibilityService({ eventRepository, eventEntryRepository, auditRepository,
  eventService = null, now = () => new Date() }) {
  async function audit({ name, event, viewer, outcome, correlationId, requestedVisibility = null, reasonCode = null }) {
    await auditRepository?.append({
      name, actorAccountId: viewer?.account?._id ?? null, subjectType: 'event',
      subjectId: event?._id ?? 'unknown', outcome, correlationId,
      metadata: {
        priorVisibility: event?.visibility ?? null, requestedVisibility,
        priorLifecycleStatus: event?.lifecycleStatus ?? null,
        requestedLifecycleStatus: name === 'event.archived' ? 'archived' : null, reasonCode,
      },
    })
  }
  return Object.freeze({
    async detail(publicId, viewer) {
      const event = await eventRepository.findByPublicId(publicId)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      const access = eventDetailAccess(event, viewer?.account?._id)
      if (access === 'NONE') throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (access === 'PRIVATE_SUMMARY') {
        const entries = await eventEntryRepository.listActiveByEvent(event._id)
        return privateEventSummary(event, deriveEventAnalytics(event, entries))
      }
      if (eventService) {
        const result = await eventService.eventByPublicId({ publicId, viewer })
        return { ...result.event, __typename: 'Event', detailAccess: access }
      }
      return { ...toEventView(event, viewer?.account?._id), detailAccess: access }
    },
    async setVisibility(input, viewer, { correlationId } = {}) {
      const event = await eventRepository.findById(input.eventId)
      const requestedVisibility = String(input.visibility ?? '').toLowerCase()
      if (!viewer?.account?._id || !event || String(event.ownerAccountId) !== String(viewer.account._id)) {
        await audit({ name: 'event.visibility_change_denied', event: event ?? { _id: input.eventId },
          viewer, outcome: 'denied', correlationId, requestedVisibility, reasonCode: 'FORBIDDEN' })
        throw new ApplicationError(ErrorCode.FORBIDDEN)
      }
      if (!EVENT_VISIBILITIES.has(requestedVisibility)) throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      const updated = await eventRepository.setVisibility(event._id, viewer.account._id, requestedVisibility,
        new Date(input.expectedUpdatedAt), now())
      if (!updated) throw new ApplicationError(ErrorCode.CONFLICT)
      await audit({ name: 'event.visibility_changed', event, viewer, outcome: 'success', correlationId,
        requestedVisibility })
      return toEventView(updated, viewer.account._id)
    },
    async archive(input, viewer, { correlationId } = {}) {
      const event = await eventRepository.findById(input.eventId)
      if (!viewer?.account?._id || !event || String(event.ownerAccountId) !== String(viewer.account._id)) {
        await audit({ name: 'event.visibility_change_denied', event: event ?? { _id: input.eventId },
          viewer, outcome: 'denied', correlationId, reasonCode: 'FORBIDDEN' })
        throw new ApplicationError(ErrorCode.FORBIDDEN)
      }
      if (input.confirmation !== true) throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      const updated = await eventRepository.archiveEvent(event._id, viewer.account._id,
        new Date(input.expectedUpdatedAt), now())
      if (!updated) throw new ApplicationError(ErrorCode.CONFLICT)
      await audit({ name: 'event.archived', event, viewer, outcome: 'success', correlationId })
      return toEventView(updated, viewer.account._id)
    },
  })
}
