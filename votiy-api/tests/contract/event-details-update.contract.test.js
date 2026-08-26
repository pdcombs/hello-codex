import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event detail update contract', () => {
  it('exposes additive mutation and input', async () => {
    const schema = await createGraphqlSchema()
    const mutation = schema.getMutationType().getFields().updateEventDetails
    expect(String(mutation.type)).toBe('EventResult!')
    const fields = schema.getType('UpdateEventDetailsInput').getFields()
    expect(Object.keys(fields)).toEqual(['eventId', 'title', 'description', 'location', 'expectedUpdatedAt'])
    const operation = `mutation UpdateEventDetails($input: UpdateEventDetailsInput!) {
      updateEventDetails(input: $input) { __typename ... on EventSuccess { event { id title description location updatedAt } }
        ... on OperationError { code message correlationId fieldErrors { field message } } } }`
    expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
  })
})
