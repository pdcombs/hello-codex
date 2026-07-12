import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { projectEventSetup } from '../../src/services/event-service.js'

describe('grouped event setup projection', () => {
  it('preserves category/entry order, empty categories, owners, and excludes removed/contact data', () => {
    const ownerAccountId = new ObjectId()
    const participantId = new ObjectId()
    const removedId = new ObjectId()
    const categoryA = new ObjectId()
    const categoryB = new ObjectId()
    const now = new Date('2026-07-01')
    const event = { _id: new ObjectId(), ownerAccountId, publicId: 'grouped', title: 'Grouped', description: null,
      location: null, registrationPolicy: 'open', createdAt: now, updatedAt: now, categories: [
        { _id: categoryA, title: 'A', titleNormalized: 'a', isDefault: true, createdAt: now, updatedAt: now },
        { _id: categoryB, title: 'B', titleNormalized: 'b', isDefault: false, createdAt: now, updatedAt: now },
      ] }
    const entry = (title, categoryId) => ({ _id: new ObjectId(), title, categoryId, createdByAccountId: ownerAccountId, createdAt: now })
    const result = projectEventSetup(event, [
      { accountId: participantId, status: 'registered', entries: [entry('First', categoryA), entry('Second', categoryA)] },
      { accountId: removedId, status: 'removed', entries: [entry('Hidden', categoryB)] },
    ], [
      { _id: participantId, displayName: 'Peyton', emailNormalized: 'private@example.test', phoneNormalized: '+15555550100' },
      { _id: removedId, displayName: 'Removed' },
    ])
    expect(result.categories.map(({ title }) => title)).toEqual(['A', 'B'])
    expect(result.categories[0].entries.map(({ title }) => title)).toEqual(['First', 'Second'])
    expect(result.categories[0].entries[0].ownerDisplayName).toBe('Peyton')
    expect(result.categories[1].entries).toEqual([])
    expect(JSON.stringify(result)).not.toContain('private@example.test')
    expect(JSON.stringify(result)).not.toContain('+15555550100')
  })
})
