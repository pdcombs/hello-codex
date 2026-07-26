export const initialEventSearchState = Object.freeze({
  status: 'closed', query: '', nodes: [], nextCursor: null, error: null, requestId: 0,
})

export function eventSearchReducer(state, action) {
  switch (action.type) {
    case 'OPEN': return { ...initialEventSearchState, status: 'idle' }
    case 'CLOSE': return initialEventSearchState
    case 'QUERY': return { ...state, status: action.query.trim() ? 'debouncing' : 'idle',
      query: action.query, nodes: [], nextCursor: null, error: null, requestId: state.requestId + 1 }
    case 'LOADING': return action.requestId === state.requestId
      ? { ...state, status: action.more ? 'loading-more' : 'loading', error: null } : state
    case 'SUCCESS': {
      if (action.requestId !== state.requestId) return state
      const nodes = action.more
        ? [...new Map([...state.nodes, ...action.nodes].map((node) => [node.publicId, node])).values()]
        : action.nodes
      return { ...state, status: action.nextCursor ? 'results' : nodes.length ? 'complete' : 'empty',
        nodes, nextCursor: action.nextCursor, error: null }
    }
    case 'FAILURE': return action.requestId === state.requestId
      ? { ...state, status: action.more ? 'more-error' : 'error', error: action.error } : state
    default: return state
  }
}
