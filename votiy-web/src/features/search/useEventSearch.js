import { useCallback, useEffect, useReducer, useRef } from 'react'
import { eventSearchReducer, initialEventSearchState } from './event-search-state.js'
import { searchPublicEvents } from './event-search.graphql.js'

export default function useEventSearch({ search = searchPublicEvents, debounceMs = 300 } = {}) {
  const [state, dispatch] = useReducer(eventSearchReducer, initialEventSearchState)
  const abortRef = useRef(null)
  useEffect(() => {
    if (state.status !== 'debouncing') return undefined
    const requestId = state.requestId
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      dispatch({ type: 'LOADING', requestId })
      try {
        const result = await search({ query: state.query, first: 20 }, { signal: abortRef.current.signal })
        dispatch({ type: 'SUCCESS', requestId, nodes: result.events.nodes,
          nextCursor: result.events.nextCursor, more: false })
      } catch (error) {
        if (error.name !== 'AbortError') dispatch({ type: 'FAILURE', requestId, error })
      }
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [state.status, state.query, state.requestId, search, debounceMs])

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.status === 'loading-more') return
    const requestId = state.requestId
    dispatch({ type: 'LOADING', requestId, more: true })
    try {
      const result = await search({ query: state.query, first: 20, after: state.nextCursor })
      dispatch({ type: 'SUCCESS', requestId, nodes: result.events.nodes,
        nextCursor: result.events.nextCursor, more: true })
    } catch (error) { dispatch({ type: 'FAILURE', requestId, error, more: true }) }
  }, [state, search])

  return {
    state,
    open: () => dispatch({ type: 'OPEN' }),
    close: () => { abortRef.current?.abort(); dispatch({ type: 'CLOSE' }) },
    setQuery: (query) => dispatch({ type: 'QUERY', query }),
    retry: () => dispatch({ type: 'QUERY', query: state.query }),
    loadMore,
  }
}
