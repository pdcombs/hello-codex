import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event ballot GraphQL contract', () => {
  it('validates capability and submission operations', async () => {
    const schema = await createGraphqlSchema()
    expect(validateGraphqlOperation(schema, `query C($id: ID!) { eventVotingCapability(eventId: $id) { __typename } }`).errors).toEqual([])
    expect(validateGraphqlOperation(schema, `mutation S($input: SubmitEventBallotInput!) {
      submitEventBallot(input: $input) { __typename ... on BallotSubmissionSuccess { receipt { id rulesVersion } } }
    }`).errors).toEqual([])
  })
})
