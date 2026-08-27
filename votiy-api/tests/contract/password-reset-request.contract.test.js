import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'
describe('password reset GraphQL contract', () => {
  it('exposes request, inspect, and completion operations', async () => {
    const schema = await createGraphqlSchema()
    expect(Object.keys(schema.getMutationType().getFields())).toEqual(expect.arrayContaining(['requestPasswordReset', 'resetPassword']))
    expect(schema.getQueryType().getFields().inspectPasswordReset).toBeDefined()
    const source = `mutation R($input: RequestPasswordResetInput!) { requestPasswordReset(input:$input) {
      ... on PasswordResetRequestSuccess { accepted bypassToken } ... on OperationError { code correlationId fieldErrors { field message } } } }`
    expect(validateGraphqlOperation(schema, source).errors).toEqual([])
  })
})
