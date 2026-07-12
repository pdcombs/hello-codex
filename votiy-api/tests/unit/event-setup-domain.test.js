import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { deriveDisplayName } from '../../src/domain/account.js'
import { createCategory } from '../../src/domain/event-category.js'
import { createEntry } from '../../src/domain/event-entry.js'

const now = new Date('2026-07-01T12:00:00.000Z')

describe('event setup domain', () => {
  it('derives stable display names without contact suffixes', () => {
    expect(deriveDisplayName({ emailNormalized: 'Peyton@example.test' })).toBe('Peyton')
    expect(deriveDisplayName({ phoneOnlyPosition: 3 })).toBe('Participant 3')
    expect(() => deriveDisplayName({})).toThrow('Display name source is required')
  })

  it('constructs normalized categories and enforces title limits', () => {
    expect(createCategory({ title: '  Best Dessert  ', isDefault: true, now })).toMatchObject({
      title: 'Best Dessert', titleNormalized: 'best dessert', isDefault: true,
    })
    expect(() => createCategory({ title: ' ', now })).toThrow('Invalid category title')
    expect(() => createCategory({ title: 'x'.repeat(121), now })).toThrow('Invalid category title')
  })

  it('constructs entries with immutable ownership and category references', () => {
    const categoryId = new ObjectId()
    const actorId = new ObjectId()
    expect(createEntry({ title: '  Apple Pie ', categoryId, createdByAccountId: actorId, now }))
      .toMatchObject({ title: 'Apple Pie', categoryId, createdByAccountId: actorId, schemaVersion: 1 })
    expect(() => createEntry({ title: 'x'.repeat(161), categoryId, createdByAccountId: actorId, now }))
      .toThrow('Invalid entry title')
  })
})
