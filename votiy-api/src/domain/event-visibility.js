import { ApplicationError, ErrorCode } from './errors.js'

export const EVENT_VISIBILITIES = new Set(['public', 'private', 'unlisted'])

export function assertActiveEvent(event) {
  if (event.lifecycleStatus === 'archived') throw new ApplicationError(ErrorCode.CONFLICT)
  return event
}

export function eventDetailAccess(event, viewerAccountId) {
  const isHost = viewerAccountId && String(event.ownerAccountId) === String(viewerAccountId)
  if (event.lifecycleStatus === 'archived') return isHost ? 'ARCHIVED_READ_ONLY' : 'NONE'
  if (isHost) return 'FULL'
  return event.visibility === 'private' ? 'PRIVATE_SUMMARY' : 'FULL'
}

export function privateEventSummary(event, analytics = {}) {
  return Object.freeze({
    __typename: 'PrivateEventSummary',
    publicId: event.publicId,
    title: event.title,
    description: event.description,
    visibility: 'PRIVATE',
    lifecycleStatus: 'ACTIVE',
    detailAccess: 'PRIVATE_SUMMARY',
    categoryCount: analytics.categoryCount ?? 0,
    participantCount: analytics.participantCount ?? 0,
    entryCount: analytics.entryCount ?? 0,
  })
}

export function visibilityAuditEvent({ action, outcome, event, requestedVisibility = null, actorAccountId = null,
  correlationId, reasonCode = null }) {
  return {
    name: outcome === 'success' ? `event.${action}` : 'event.visibility_change_denied',
    actorAccountId, subjectType: 'event', subjectId: event?._id ?? event?.id,
    outcome, correlationId,
    metadata: {
      priorVisibility: event?.visibility ?? null,
      requestedVisibility,
      priorLifecycleStatus: event?.lifecycleStatus ?? null,
      requestedLifecycleStatus: action === 'archived' ? 'archived' : null,
      reasonCode,
    },
  }
}
