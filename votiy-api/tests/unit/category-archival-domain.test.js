import { describe, expect, it } from 'vitest'
import { createCategory, isActiveCategory } from '../../src/domain/event-category.js'
import { toEventView } from '../../src/domain/event.js'

describe('category archival domain', () => {
  it('creates explicit active lifecycle and excludes archived categories from projections', () => {
    const active = createCategory({ title: 'Active' })
    expect(active).toMatchObject({ status: 'active', archiveReason: null, archivedAt: null, archivedByAccountId: null })
    const archived = { ...active, _id: 'archived', status: 'archived' }
    expect(isActiveCategory(archived)).toBe(false)
    const view = toEventView({ _id: 'event', ownerAccountId: 'owner', publicId: 'event', title: 'Event',
      registrationPolicy: 'open', categories: [active, archived], createdAt: new Date(), updatedAt: new Date() })
    expect(view.categories.map(({ title }) => title)).toEqual(['Active'])
  })

  it('rejects blank titles and treats a missing lifecycle as active for migration compatibility', () => {
    expect(() => createCategory({ title: '   ' })).toThrow(TypeError)
    expect(isActiveCategory({ title: 'Legacy' })).toBe(true)
    expect(isActiveCategory(null)).toBe(true)
  })
})
