import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event short link contract', () => {
  it('supports host update and public resolution', async () => {
    const schema = await createGraphqlSchema()
    expect(validateGraphqlOperation(schema, `mutation U($input: UpdateEventShortIdInput!) {
      updateEventShortId(input: $input) { ... on EventSuccess { event { publicId shortId } }
        ... on OperationError { code message } } }`).errors).toEqual([])
    expect(validateGraphqlOperation(schema, `query S($shortId: String!) { eventShortLink(shortId: $shortId) {
      ... on EventShortLinkSuccess { shortLink { publicId } } ... on OperationError { code } } }`).errors).toEqual([])
  })
})
