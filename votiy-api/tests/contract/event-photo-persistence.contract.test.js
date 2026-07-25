import { describe, expect, it } from 'vitest'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

describe('event photo persistence contract', () => {
  it('requires bounded binary data and unique event/public lookups', () => {
    const definition = collectionDefinitions.eventPhotos
    expect(definition.validator.$jsonSchema.additionalProperties).toBe(false)
    expect(definition.validator.$jsonSchema.properties.byteLength.maximum).toBe(350 * 1024)
    expect(definition.indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: { eventId: 1 }, unique: true }),
      expect.objectContaining({ key: { publicId: 1 }, unique: true }),
    ]))
  })
})
