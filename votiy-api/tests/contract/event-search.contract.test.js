import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('Feature 010 GraphQL contract', () => {
  it('adds search and viewer-aware detail without weakening Event fields', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getType('Event').getFields().voting.type.toString()).toBe('EventVotingCapability!')
    expect(schema.getType('PrivateEventSummary')).toBeDefined()
    expect(schema.getType('EventDetailViewResult').getTypes().map(({ name }) => name)).toEqual([
      'Event', 'PrivateEventSummary', 'OperationError',
    ])
    expect(validateGraphqlOperation(schema, `query Search($query: String!) {
      searchPublicEvents(query: $query) { __typename ... on PublicEventSearchSuccess {
        events { nodes { publicId title visibility } nextCursor } } }
    }`).errors).toEqual([])
  })
})
