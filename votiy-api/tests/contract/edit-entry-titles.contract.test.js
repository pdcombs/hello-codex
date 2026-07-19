import { describe, expect, it } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'
import { updateEventCategoryInputSchema } from '../../src/domain/validation.js'

describe('edit entry titles contract', () => {
  it('adds the batch mutation and preserves legacy rename', async () => {
    const schema = await createGraphqlSchema()
    const mutations = schema.getMutationType().getFields()
    expect(mutations.updateEventCategory.args[0].type.toString()).toBe('UpdateEventCategoryInput!')
    expect(mutations.updateEventCategory.type.toString()).toBe('EventResult!')
    expect(mutations.renameEventCategory).toBeDefined()
    expect(schema.getType('EventEntry').getFields().updatedAt.type.toString()).toBe('DateTime!')
  })

  it('requires full entry timestamps and a category timestamp', async () => {
    const schema = await createGraphqlSchema()
    const input = schema.getType('UpdateEventCategoryInput').getFields()
    expect(input.expectedCategoryUpdatedAt.type.toString()).toBe('DateTime!')
    expect(input.entryTitles.type.toString()).toBe('[CategoryEntryTitleUpdateInput!]!')
    const entry = schema.getType('CategoryEntryTitleUpdateInput').getFields()
    expect(entry.expectedUpdatedAt.type.toString()).toBe('DateTime!')
  })

  it('publishes indexed validation errors and enforces the snapshot bound', () => {
    const baseEntry = { entryId: 'entry-1', title: '', expectedUpdatedAt: '2026-07-19T12:00:00.000Z' }
    const result = updateEventCategoryInputSchema.safeParse({ eventId: 'event-1', categoryId: 'category-1',
      title: 'Category', expectedCategoryUpdatedAt: '2026-07-19T12:00:00.000Z',
      entryTitles: [baseEntry], idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' })
    expect(result.error.issues[0].path.join('.')).toBe('entryTitles.0.title')
  })
})
