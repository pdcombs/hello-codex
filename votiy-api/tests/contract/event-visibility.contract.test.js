import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event visibility contract', () => {
  it('supports host mutations and viewer-aware detail projections', async () => {
    const schema = await createGraphqlSchema()
    const source = `query Detail($id: String!) { eventDetailView(publicId: $id) {
      __typename ... on Event { publicId detailAccess } ... on PrivateEventSummary {
        publicId title categoryCount participantCount entryCount } } }
      mutation Visibility($input: SetEventVisibilityInput!) { setEventVisibility(input: $input) { __typename } }`
    expect(validateGraphqlOperation(schema, source).errors).toEqual([])
  })
})
