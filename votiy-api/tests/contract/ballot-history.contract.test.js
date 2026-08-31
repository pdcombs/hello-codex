import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

describe('ballot history contract', () => {
  it('exposes private pagination and history availability', async () => {
    const schema = await createGraphqlSchema()
    expect(validateGraphqlOperation(schema, `query H($publicId: String!, $first: Int, $after: String) {
      eventBallotHistory(publicId: $publicId, first: $first, after: $after) { __typename
        ... on EventBallotHistorySuccess { history { nodes { id submittedAt } nextCursor hasMore mayCastAnother } }
      }
    }`).errors).toEqual([])
    expect(schema.getType('VotingAccessDecision').getFields()).toHaveProperty('hasBallotHistory')
  })
  it('declares identity-scoped stable history indexes', () => {
    expect(collectionDefinitions.ballotSubmissions.indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'ballot_history_event_account' }),
      expect.objectContaining({ name: 'ballot_history_event_browser' }),
    ]))
  })
})
