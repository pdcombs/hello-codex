import { describe, expect, it } from 'vitest'
import { createSearchCursor, digestSearchQuery, parseSearchCursor } from '../../src/domain/event-search.js'

describe('event search pagination', () => {
  it('binds a stable score/date/id cursor to its query', () => {
    const queryDigest = digestSearchQuery(['show'])
    const payload = { queryDigest, score: 10, createdAt: '2026-01-01T00:00:00.000Z', id: 'abc' }
    const cursor = createSearchCursor(payload, 'secret')
    expect(parseSearchCursor(cursor, 'secret', queryDigest)).toEqual(payload)
    expect(() => parseSearchCursor(cursor, 'secret', digestSearchQuery(['other']))).toThrow()
  })
})
