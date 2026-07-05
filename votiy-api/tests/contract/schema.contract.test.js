import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('GraphQL schema contract', () => {
  it('loads the checked-in account, event, and registration operations', async () => {
    const schema = await createGraphqlSchema()
    expect(Object.keys(schema.getQueryType().getFields())).toEqual([
      'viewer', 'ownedEvents', 'eventByPublicId', 'eventRegistrations',
    ])
    expect(Object.keys(schema.getMutationType().getFields())).toContain('addEventParticipant')
    expect(Object.keys(schema.getTypeMap()).filter((name) => !name.startsWith('__')).sort()).toMatchSnapshot()
  })

  it('validates representative checked-in client operations', async () => {
    const schema = await createGraphqlSchema()
    const operations = [
      'query Viewer { viewer { __typename } }',
      'query Event($publicId: String!) { eventByPublicId(publicId: $publicId) { __typename } }',
      'mutation SignOut { signOut { __typename } }',
    ]
    for (const operation of operations) {
      expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
    }
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
