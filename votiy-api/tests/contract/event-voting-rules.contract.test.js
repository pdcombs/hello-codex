import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event voting rules GraphQL contract', () => {
  it('exposes additive capability and host update operations', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getType('Event').getFields().voting).toBeDefined()
    expect(schema.getMutationType().getFields().updateEventVotingRules).toBeDefined()
    const operation = `mutation Update($input: UpdateEventVotingRulesInput!) {
      updateEventVotingRules(input: $input) { __typename ... on EventSuccess { event { id voting { rules { version } } } } }
    }`
    expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
  })
})
