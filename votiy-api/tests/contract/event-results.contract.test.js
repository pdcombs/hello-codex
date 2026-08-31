import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event results GraphQL contract', () => {
  it('exposes host result totals, methods, ordering, and winners', async () => {
    const schema = await createGraphqlSchema()
    const operation = `query R($publicId: String!) { eventVotingResults(publicId: $publicId) { __typename
      ... on EventVotingResultsSuccess { results { votesReceived calculatedAt event { id isOwner }
        categories { categoryId categoryTitle categoryOrder method contributingBallots
          entries { entryId entryTitle entryOrder total winner } } } }
      ... on OperationError { code message } } }`
    expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
  })
})
