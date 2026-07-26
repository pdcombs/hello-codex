import { describe, expect, it, vi } from 'vitest'
import { createEventSearchService } from '../../src/services/event-search-service.js'

describe('event search service', () => {
  it('validates input, maps minimal fields, and hides private location', async () => {
    const search = vi.fn().mockResolvedValue([{
      _id: '1', publicId: 'private', title: 'Private', description: 'Summary', location: 'Hidden',
      visibility: 'private', searchScore: 100, createdAt: new Date(),
    }])
    const service = createEventSearchService({ eventRepository: { search }, cursorSecret: 'secret' })
    await expect(service.search({ query: '', first: 20 })).resolves.toEqual({
      events: { nodes: [], nextCursor: null },
    })
    const result = await service.search({ query: 'private', first: 20 })
    expect(result.events.nodes[0]).toEqual({
      publicId: 'private', title: 'Private', description: 'Summary', location: null, visibility: 'PRIVATE',
    })
    await expect(service.search({ query: 'x'.repeat(121), first: 20 })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    })
  })
})
