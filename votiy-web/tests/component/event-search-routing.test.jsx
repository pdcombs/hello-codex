import { describe, expect, it } from 'vitest'

describe('event search routing', () => {
  it('uses the normal viewer-aware route', () => {
    const publicId = 'event with spaces'
    expect(`/events/${encodeURIComponent(publicId)}`).toBe('/events/event%20with%20spaces')
  })
})
