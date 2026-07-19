import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('recent entry owner query', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('returns distinct active owners newest first and excludes archives', async () => {
    const repository = createEventEntryRepository(mongo.database)
    const eventId = new ObjectId(); const categoryId = new ObjectId(); const actor = new ObjectId()
    const oldOwner = new ObjectId(); const newestOwner = new ObjectId()
    const archivedOwner = new ObjectId()
    await repository.createMany({ eventId, ownerAccountId: oldOwner, createdByAccountId: actor,
      entries: [{ categoryId, title: 'Old' }], now: new Date('2026-07-19T10:00:00Z') })
    await repository.createMany({ eventId, ownerAccountId: newestOwner, createdByAccountId: actor,
      entries: [{ categoryId, title: 'Newest' }, { categoryId, title: 'Also newest' }],
      now: new Date('2026-07-19T12:00:00Z') })
    const [archived] = await repository.createMany({ eventId, ownerAccountId: archivedOwner,
      createdByAccountId: actor, entries: [{ categoryId, title: 'Archived' }],
      now: new Date('2026-07-19T13:00:00Z') })
    await repository.archiveOne({ eventId, entryId: archived._id, archivedByAccountId: actor,
      now: new Date('2026-07-19T13:01:00Z') })
    const recent = await repository.listRecentOwners(eventId, 10)
    expect(recent.map(({ ownerAccountId }) => String(ownerAccountId))).toEqual([
      String(newestOwner), String(oldOwner),
    ])
    const explanation = await mongo.database.collection('eventEntries').aggregate([
      { $match: { eventId, status: 'active' } },
      { $sort: { createdAt: -1, _id: -1 } },
    ], { hint: 'entry_event_recent_owners' }).explain('queryPlanner')
    expect(JSON.stringify(explanation.queryPlanner.winningPlan)).toContain('entry_event_recent_owners')
  })
})
