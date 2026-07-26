import { describe, expect, it } from 'vitest'
import {
  createEventSearchProjection, createSearchCursor, digestSearchQuery, eventMatchesTerms,
  eventSearchScore, normalizeSearchText, parseSearchCursor, searchTerms,
} from '../../src/domain/event-search.js'

describe('event search domain', () => {
  it('normalizes diacritics, punctuation, stop words, and middle-word grams', () => {
    expect(normalizeSearchText('  Café—SHOW!  ')).toBe('cafe show')
    expect(searchTerms('the motorcycle show in Rogers')).toEqual(['motorcycle', 'show', 'rogers'])
    const projection = createEventSearchProjection({ title: 'Motorcycle', description: '', location: '' })
    expect(projection.searchTitleGrams).toEqual(expect.arrayContaining(['ot', 'oto', 'cyc']))
    expect(eventMatchesTerms(projection, ['torc'])).toBe(true)
    expect(eventSearchScore(projection, ['torc'])).toBe(100)
  })

  it('signs cursors and rejects tampering or another query', () => {
    const queryDigest = digestSearchQuery(['motorcycle'])
    const cursor = createSearchCursor({ queryDigest, score: 100, createdAt: new Date().toISOString(), id: 'a' }, 'secret')
    expect(parseSearchCursor(cursor, 'secret', queryDigest).score).toBe(100)
    expect(() => parseSearchCursor(`${cursor}x`, 'secret', queryDigest)).toThrow('Invalid')
    expect(() => parseSearchCursor(cursor, 'secret', digestSearchQuery(['other']))).toThrow('Invalid')
  })
})
