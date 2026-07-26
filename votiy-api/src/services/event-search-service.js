import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { createSearchCursor, digestSearchQuery, parseSearchCursor, searchTerms } from '../domain/event-search.js'

export function createEventSearchService({ eventRepository, cursorSecret, logger, now = () => Date.now() }) {
  return Object.freeze({
    async search({ query, first = 20, after = null }, { correlationId = null } = {}) {
      const startedAt = now()
      try {
        if (typeof query !== 'string' || query.length > 120 || !Number.isInteger(first) || first < 1 || first > 20) {
          throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
        }
        const terms = searchTerms(query)
        if (!terms.length) return { events: { nodes: [], nextCursor: null } }
        const queryDigest = digestSearchQuery(terms)
        let cursor = null
        try { cursor = after ? parseSearchCursor(after, cursorSecret, queryDigest) : null }
        catch { throw new ApplicationError(ErrorCode.VALIDATION_FAILED) }
        const rows = await eventRepository.search({ terms, first, cursor })
        const hasMore = rows.length > first
        const nodes = rows.slice(0, first).map((event) => ({
          publicId: event.publicId, title: event.title, description: event.description ?? null,
          location: event.visibility === 'private' ? null : event.location ?? null,
          visibility: event.visibility.toUpperCase(),
        }))
        const boundary = rows[first - 1]
        const nextCursor = hasMore ? createSearchCursor({
          queryDigest, score: boundary.searchScore, createdAt: boundary.createdAt.toISOString(), id: String(boundary._id),
        }, cursorSecret) : null
        logger?.info({ event: 'event.search.completed', operation: 'event.search', outcome: 'success',
          durationMs: now() - startedAt, termCount: terms.length, pageSize: first, resultCount: nodes.length,
          hasMore, correlationId }, 'Event search completed')
        return { events: { nodes, nextCursor } }
      } catch (error) {
        logger?.error({ event: 'event.search.completed', operation: 'event.search', outcome: 'failure',
          durationMs: now() - startedAt, correlationId, errorCode: error.code ?? 'SERVICE_UNAVAILABLE' },
        'Event search failed')
        throw error
      }
    },
  })
}
