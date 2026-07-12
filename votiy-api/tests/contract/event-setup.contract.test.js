import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event setup GraphQL contract', () => {
  it('requires display names and complete nested entry inputs', async () => {
    const schema = await createGraphqlSchema()
    const operations = [
      'mutation Register($input: RegisterInput!) { register(input: $input) { __typename } }',
      'mutation Add($input: AddEventParticipantInput!) { addEventParticipant(input: $input) { __typename } }',
      'mutation Self($input: RegisterForEventInput!) { registerForEvent(input: $input) { __typename } }',
    ]
    for (const operation of operations) expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
    expect(schema.getType('AddEventParticipantInput').getFields()).toMatchObject({
      displayName: expect.any(Object), entries: expect.any(Object),
    })
  })
})
