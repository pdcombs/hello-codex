import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchPublicEvents } from '../../src/features/search/event-search.graphql.js'

describe('event search GraphQL client', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('sends anonymous query metadata and unwraps success', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true, headers: { get: () => null },
      json: async () => ({ data: { searchPublicEvents: {
        __typename: 'PublicEventSearchSuccess', events: { nodes: [], nextCursor: null },
      } } }),
    })
    vi.stubGlobal('fetch', fetch)
    await expect(searchPublicEvents({ query: 'show' })).resolves.toEqual({
      __typename: 'PublicEventSearchSuccess', events: { nodes: [], nextCursor: null },
    })
    expect(JSON.parse(fetch.mock.calls[0][1].body).operationName).toBe('SearchPublicEvents')
  })
})
