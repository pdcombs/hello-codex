import { describe, expect, it } from 'vitest'
import { createCategory } from '../../src/domain/event-category.js'

describe('category archival persistence contract', () => {
  it('requires an explicit active lifecycle on newly persisted categories', () => {
    expect(Object.keys(createCategory({ title: 'Category' }))).toEqual([
      '_id', 'title', 'titleNormalized', 'isDefault', 'status', 'archiveReason', 'archivedAt',
      'archivedByAccountId', 'createdAt', 'updatedAt',
    ])
  })
})
