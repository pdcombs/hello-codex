import { describe, expect, it } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'

describe('event voting summary privacy contract', () => {
  it('keeps every voting source out of PrivateEventSummary', async () => {
    const schema = await createGraphqlSchema()
    const fields = Object.keys(schema.getType('PrivateEventSummary').getFields())
    expect(fields).not.toEqual(expect.arrayContaining([
      'voting', 'votingRules', 'opensAt', 'closesAt', 'accessPolicy', 'defaultCategoryRule',
      'categoryRules', 'codeRequiresCompletedAccount', 'votingStatus', 'canVote',
    ]))
  })
})
