import { describe, expect, it } from 'vitest'
import { eventSearchReducer, initialEventSearchState } from '../../src/features/search/event-search-state.js'

describe('event search state', () => {
  it('rejects stale responses and deduplicates appended pages', () => {
    let state = eventSearchReducer(initialEventSearchState, { type: 'OPEN' })
    state = eventSearchReducer(state, { type: 'QUERY', query: 'motor' })
    const requestId = state.requestId
    expect(eventSearchReducer(state, { type: 'SUCCESS', requestId: requestId - 1, nodes: [], nextCursor: null })).toBe(state)
    state = eventSearchReducer(state, { type: 'SUCCESS', requestId, nodes: [{ publicId: '1' }], nextCursor: 'next' })
    state = eventSearchReducer(state, { type: 'SUCCESS', requestId, more: true,
      nodes: [{ publicId: '1' }, { publicId: '2' }], nextCursor: null })
    expect(state.nodes.map(({ publicId }) => publicId)).toEqual(['1', '2'])
    expect(state.status).toBe('complete')
  })

  it('covers loading, empty, retryable failure, and close transitions', () => {
    let state = eventSearchReducer(initialEventSearchState, { type: 'OPEN' })
    state = eventSearchReducer(state, { type: 'QUERY', query: 'show' })
    const requestId = state.requestId
    state = eventSearchReducer(state, { type: 'LOADING', requestId })
    expect(state.status).toBe('loading')
    state = eventSearchReducer(state, { type: 'FAILURE', requestId, error: new Error('offline') })
    expect(state.status).toBe('error')
    state = eventSearchReducer(state, { type: 'SUCCESS', requestId, nodes: [], nextCursor: null })
    expect(state.status).toBe('empty')
    expect(eventSearchReducer(state, { type: 'LOADING', requestId: requestId - 1 })).toBe(state)
    expect(eventSearchReducer(state, { type: 'FAILURE', requestId: requestId - 1 })).toBe(state)
    expect(eventSearchReducer(state, { type: 'UNKNOWN' })).toBe(state)
    expect(eventSearchReducer(state, { type: 'CLOSE' })).toBe(initialEventSearchState)
  })
})
