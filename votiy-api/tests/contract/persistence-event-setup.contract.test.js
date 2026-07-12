import { describe, expect, it } from 'vitest'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

describe('event setup persistence contract', () => {
  it('accepts transitional account versions and requires display names for version 2', () => {
    const schema = collectionDefinitions.accounts.validator.$jsonSchema
    expect(schema.oneOf).toHaveLength(2)
    expect(schema.oneOf[1].required).toContain('displayName')
    expect(schema.oneOf[1].properties.schemaVersion).toEqual({ enum: [2] })
  })

  it('accepts transitional events and registrations with version-2 embedded data', () => {
    const eventSchema = collectionDefinitions.events.validator.$jsonSchema
    const registrationSchema = collectionDefinitions.eventRegistrations.validator.$jsonSchema
    expect(eventSchema.oneOf[1].required).toContain('categories')
    expect(eventSchema.oneOf[1].properties.categories.maxItems).toBe(100)
    expect(registrationSchema.oneOf[1].required).toContain('entries')
    expect(registrationSchema.oneOf[1].properties.entries.maxItems).toBe(100)
  })
})
