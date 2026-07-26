import { describe, expect, it } from 'vitest'
import { createEventSearchProjection, eventMatchesTerms } from '../../src/domain/event-search.js'

describe('event search performance budget', () => {
  it('verifies 10,000 projected candidates below the one-second first-page budget', () => {
    const rows = Array.from({ length: 10_000 }, (_, index) => createEventSearchProjection({
      title: `Motorcycle show ${index}`, description: 'Competition', location: 'Rogers AR',
    }))
    const startedAt = performance.now()
    expect(rows.filter((row) => eventMatchesTerms(row, ['torcy'])).slice(0, 20)).toHaveLength(20)
    expect(performance.now() - startedAt).toBeLessThan(1000)
  })
})
