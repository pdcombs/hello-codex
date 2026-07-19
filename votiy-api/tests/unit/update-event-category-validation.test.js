import { describe, expect, it } from 'vitest'
import { updateEventCategoryInputSchema } from '../../src/domain/validation.js'

const base = {
  eventId: 'event-1', categoryId: 'category-1', title: 'Category',
  expectedCategoryUpdatedAt: '2026-07-19T12:00:00.000Z',
  entryTitles: [{ entryId: 'entry-1', title: 'Entry', expectedUpdatedAt: '2026-07-19T12:00:00.000Z' }],
  idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
}

describe('update event category validation', () => {
  it('trims titles and coerces timestamps', () => {
    const result = updateEventCategoryInputSchema.parse({ ...base, title: ' Category ',
      entryTitles: [{ ...base.entryTitles[0], title: ' Entry ' }] })
    expect(result.title).toBe('Category')
    expect(result.entryTitles[0].title).toBe('Entry')
    expect(result.expectedCategoryUpdatedAt).toBeInstanceOf(Date)
  })

  it('returns indexed errors and rejects duplicate entry IDs', () => {
    const result = updateEventCategoryInputSchema.safeParse({ ...base, entryTitles: [
      { ...base.entryTitles[0], title: ' ' }, base.entryTitles[0],
    ] })
    expect(result.success).toBe(false)
    expect(result.error.issues.map(({ path }) => path.join('.'))).toEqual(
      expect.arrayContaining(['entryTitles.0.title', 'entryTitles.1.entryId']))
  })

  it('bounds a category snapshot at 5,000 entries', () => {
    const entryTitles = Array.from({ length: 5_001 }, (_, index) => ({ ...base.entryTitles[0], entryId: `entry-${index}` }))
    expect(updateEventCategoryInputSchema.safeParse({ ...base, entryTitles }).success).toBe(false)
  })
})
