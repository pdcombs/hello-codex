import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('GraphQL schema contract', () => {
  it('loads the checked-in account, event, and registration operations', async () => {
    const schema = await createGraphqlSchema()
    expect(Object.keys(schema.getQueryType().getFields())).toEqual([
      'viewer', 'ownedEvents', 'eventByPublicId', 'eventRegistrations',
    ])
    expect(Object.keys(schema.getMutationType().getFields())).toContain('addEventParticipant')
  })

  it('serializes DateTime values as UTC instants', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getType('DateTime').serialize(new Date('2026-07-05T12:00:00-05:00')))
      .toBe('2026-07-05T17:00:00.000Z')
  })

  it('allows normal operations and blocks production introspection', async () => {
    const schema = await createGraphqlSchema()
    expect(validateGraphqlOperation(schema, '{ eventByPublicId(publicId: "x") { __typename } }').errors).toEqual([])
    expect(() => validateGraphqlOperation(schema, '{ __schema { queryType { name } } }', { isProduction: true }))
      .toThrow('introspection is disabled')
  })
})
