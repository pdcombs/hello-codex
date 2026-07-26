import { graphql } from 'graphql'
import { describe, expect, it } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'
import { createEventResolvers } from '../../src/api/graphql/event-resolvers.js'

describe('anonymous event search query', () => {
  it('returns minimal search projection without viewer session', async () => {
    const schema = await createGraphqlSchema()
    const rootValue = createEventResolvers({
      eventSearchService: { search: async () => ({ events: { nodes: [{
        publicId: 'private', title: 'Private', description: null, location: null, visibility: 'PRIVATE',
      }], nextCursor: null } }) },
      eventVisibilityService: {}, eventService: {}, eventRegistrationService: {}, eventCategoryService: {},
    })
    const result = await graphql({
      schema, rootValue, contextValue: { viewer: null, correlationId: 'test' },
      source: `{ searchPublicEvents(query: "ivate") {
        __typename ... on PublicEventSearchSuccess {
          events { nodes { publicId title description location visibility } nextCursor }
        }
      } }`,
    })
    expect(result.errors).toBeUndefined()
    expect(result.data.searchPublicEvents.events.nodes[0].location).toBeNull()
  })
})
