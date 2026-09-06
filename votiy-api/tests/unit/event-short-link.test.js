import { describe, expect, it } from 'vitest'
import { normalizeShortId, validateCustomShortId } from '../../src/domain/event-short-link.js'

describe('event short links', () => {
  it('normalizes case and accepts safe aliases', () => {
    expect(normalizeShortId(' My-Event ')).toBe('my-event')
    expect(validateCustomShortId('My-Event')).toEqual({ success: true, shortId: 'my-event' })
  })
  it('rejects reserved and malformed aliases', () => {
    expect(validateCustomShortId('EVENTS')).toMatchObject({ success: false, reason: 'reserved' })
    for (const value of ['ab', '-event', 'event-', 'my--event', '../event', 'event/settings']) {
      expect(validateCustomShortId(value).success).toBe(false)
    }
  })
})
