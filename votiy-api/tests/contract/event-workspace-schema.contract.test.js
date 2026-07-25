import { describe, expect, it } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'

describe('event workspace schema', () => {
  it('adds nullable analytics and photo fields compatibly', async () => {
    const schema = await createGraphqlSchema()
    const fields = schema.getType('Event').getFields()
    expect(String(fields.photo.type)).toBe('EventPhoto')
    expect(String(fields.analytics.type)).toBe('EventAnalytics')
    expect(String(schema.getType('EventAnalytics').getFields().entryCount.type)).toBe('Int!')
  })
})
