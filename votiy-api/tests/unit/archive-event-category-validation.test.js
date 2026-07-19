import { describe, expect, it } from 'vitest'
import { archiveEventCategoryInputSchema } from '../../src/domain/validation.js'

const valid = { eventId: 'event', categoryId: 'category', expectedEventUpdatedAt: new Date(),
  expectedCategoryUpdatedAt: new Date(), activeEntries: [],
  idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' }

describe('archive category validation', () => {
  it('accepts exact snapshots and rejects duplicate entries', () => {
    expect(archiveEventCategoryInputSchema.safeParse(valid).success).toBe(true)
    const entry = { entryId: 'entry', expectedUpdatedAt: new Date() }
    const result = archiveEventCategoryInputSchema.safeParse({ ...valid, activeEntries: [entry, entry] })
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(['activeEntries', 1, 'entryId'])
  })
})
