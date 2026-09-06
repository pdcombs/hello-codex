import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('voting code management GraphQL contract', () => {
  it('supports generation and paginated host inventory projections', async () => {
    const schema = await createGraphqlSchema()
    expect(validateGraphqlOperation(schema, `mutation G($input: GenerateVotingCodesInput!) {
      generateVotingCodes(input: $input) { __typename ... on VotingCodeGenerationSuccess { codes { code status } } }
    }`).errors).toEqual([])
    expect(validateGraphqlOperation(schema, `query L($id: ID!, $after: String) { eventVotingCodes(eventId: $id, after: $after) {
      ... on VotingCodeListSuccess { codes { nodes { code status claimantDisplayName claimantEmail } nextCursor
        summary { usedCount availableCount revokedCount totalCount } } } } }`).errors)
      .toEqual([])
    expect(validateGraphqlOperation(schema, `query E($id: ID!) { eventVotingCodeExport(eventId: $id) {
      ... on VotingCodeExportSuccess { codes { code status usedAt claimantDisplayName claimantEmail } }
      ... on OperationError { code message } } }`).errors).toEqual([])
  })
})
