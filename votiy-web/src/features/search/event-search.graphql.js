import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'
export const SEARCH_PUBLIC_EVENTS = `query SearchPublicEvents($query: String!, $first: Int, $after: String) {
  searchPublicEvents(query: $query, first: $first, after: $after) {
    __typename
    ... on PublicEventSearchSuccess {
      events { nodes { publicId title description location visibility } nextCursor }
    }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export async function searchPublicEvents({ query, first = 20, after = null }, { signal } = {}) {
  const data = await graphqlRequest({
    query: SEARCH_PUBLIC_EVENTS, variables: { query, first, after },
    operationName: 'SearchPublicEvents', signal,
  })
  return unwrapGraphqlResult(data.searchPublicEvents)
}
