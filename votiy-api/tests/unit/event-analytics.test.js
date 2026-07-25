import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { deriveEventAnalytics } from '../../src/domain/event-analytics.js'

describe('event analytics', () => {
  it('counts active categories, entries, and distinct owners', () => {
    const active = new ObjectId()
    const archived = new ObjectId()
    const firstOwner = new ObjectId()
    const result = deriveEventAnalytics({
      categories: [{ _id: active, status: 'active' }, { _id: archived, status: 'archived' }],
    }, [
      { categoryId: active, ownerAccountId: firstOwner, status: 'active' },
      { categoryId: active, ownerAccountId: firstOwner, status: 'active' },
      { categoryId: active, ownerAccountId: new ObjectId(), status: 'archived' },
      { categoryId: archived, ownerAccountId: new ObjectId(), status: 'active' },
    ])
    expect(result).toEqual({ categoryCount: 1, entryCount: 2, participantCount: 1 })
  })

  it('returns zero participants and entries for an empty event', () => {
    expect(deriveEventAnalytics({ categories: [] }, [])).toEqual({
      categoryCount: 0, entryCount: 0, participantCount: 0,
    })
  })
})
