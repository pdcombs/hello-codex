import { describe, expect, it } from 'vitest'
import { collectionDefinitions } from '../../src/repositories/indexes.js'
import { readFile } from 'node:fs/promises'

describe('event entry persistence contract', () => {
  it('requires archival lifecycle fields and query indexes without TTL', () => {
    const definition = collectionDefinitions.eventEntries
    expect(definition.validator.$jsonSchema.required).toEqual(expect.arrayContaining([
      'eventId', 'categoryId', 'ownerAccountId', 'status', 'archiveReason', 'archivedAt', 'archivedByAccountId',
    ]))
    expect(definition.indexes.map(({ name }) => name)).toEqual([
      'entry_event_category_active', 'entry_event_owner_active', 'entry_owner_status_event', 'entry_event_recent_owners',
    ])
    expect(definition.indexes.some(({ expireAfterSeconds }) => expireAfterSeconds !== undefined)).toBe(false)
  })

  it('guards category title batches with active snapshot and conditional write fields', async () => {
    const source = await readFile(new URL('../../src/repositories/event-entry-repository.js', import.meta.url), 'utf8')
    expect(source).toContain('listActiveByEventAndCategory')
    expect(source).toContain("status: 'active', updatedAt: change.expectedUpdatedAt")
    expect(source).toContain("throw new Error('STALE_ENTRY_SNAPSHOT')")
  })
})
