import { describe, expect, it } from 'vitest'
import { addSessionReducer, createAddSession, resolveActiveCategories } from '../../src/features/events/unified-add-session.js'

describe('unified Add Session', () => {
  it('resolves non-first default and retains submission key through retry', () => {
    const categories = [
      { id: 'other', isDefault: false },
      { id: 'default', isDefault: true },
    ]
    const initial = createAddSession(categories, () => 'stable-key')
    expect(initial.categoryId).toBe('default')
    const entry = addSessionReducer(initial, { type: 'choose', mode: 'entry' })
    const failed = addSessionReducer(entry, { type: 'failed', error: new Error('retry') })
    expect(failed.idempotencyKey).toBe('stable-key')
  })

  it('supports entry navigation and filters archived categories', () => {
    let state = createAddSession([{ id: 'default', isDefault: true }], () => 'key')
    state = addSessionReducer(state, { type: 'choose', mode: 'entry' })
    state = addSessionReducer(state, { type: 'category-selected', categoryId: 'default' })
    state = addSessionReducer(state, { type: 'owner-selected', owner: { account: { accountId: 'a' } } })
    expect(state.entryStep).toBe('title')
    expect(addSessionReducer(state, { type: 'back' }).entryStep).toBe('owner')
    expect(resolveActiveCategories([{ id: 'a' }, { id: 'b', archivedAt: 'now' }])).toEqual([{ id: 'a' }])
  })

  it('preserves owner on Back and routes field failures to their originating step', () => {
    const owner = { account: { accountId: 'a', displayName: 'Peyton' } }
    let state = createAddSession([{ id: 'default', isDefault: true }], () => 'key')
    state = addSessionReducer(state, { type: 'choose', mode: 'entry' })
    state = addSessionReducer(state, { type: 'category-selected', categoryId: 'default' })
    state = addSessionReducer(state, { type: 'owner-selected', owner })
    state = addSessionReducer(state, { type: 'back' })
    expect(state.owner).toEqual(owner)
    expect(state.entryStep).toBe('owner')

    state = addSessionReducer(state, {
      type: 'failed',
      error: new Error('Category changed'),
      fieldErrors: { categoryId: 'Choose another category.' },
      entryStep: 'category',
    })
    expect(state.entryStep).toBe('category')
    expect(state.idempotencyKey).toBe('key')
  })
})
