import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event-wide voting method compatibility contract', () => {
  it('accepts legacy categoryRules input while exposing the event default', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getType('UpdateEventVotingRulesInput').getFields().categoryRules).toBeDefined()
    const operation = `query EventMethod($id: String!) { eventByPublicId(publicId: $id) {
      ... on EventSuccess { event { voting { rules {
        defaultCategoryRule { method minimumSelections maximumSelections }
        categoryRules { categoryId method }
      } } } } } }`
    expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
  })
})
