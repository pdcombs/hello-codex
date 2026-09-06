import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runEventShortLinkMigration } from '../../src/migrations/009-event-short-links.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventService } from '../../src/services/event-service.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

describe('event short links', () => {
  let mongo; let service; let first; let second
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    first = votingEventFixture({ _id: new ObjectId(), publicId: 'First_Public' })
    second = votingEventFixture({ _id: new ObjectId(), publicId: 'Second_Public' })
    await mongo.database.collection('events').insertMany([first, second])
    expect((await runEventShortLinkMigration({ database: mongo.database })).migrated).toBe(2)
    service = createEventService({ eventRepository: createEventRepository(mongo.database), idempotencyRepository: {},
      now: () => new Date('2030-02-01T00:00:00Z') })
  })
  afterAll(async () => mongo?.cleanup())

  it('backfills, resolves case-insensitively, renames, releases, and enforces uniqueness', async () => {
    expect(await service.shortLink({ shortId: 'FIRST_PUBLIC' })).toEqual({ publicId: 'First_Public' })
    const viewer = { account: { _id: votingTestIds.hostId } }
    const renamed = await service.updateShortId({ eventId: String(first._id), shortId: 'MyEvent',
      expectedUpdatedAt: first.updatedAt }, viewer)
    expect(renamed.event.shortId).toBe('myevent')
    expect(await service.shortLink({ shortId: 'MYEVENT' })).toEqual({ publicId: 'First_Public' })
    await expect(service.shortLink({ shortId: 'first_public' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(service.updateShortId({ eventId: String(second._id), shortId: 'MYEVENT',
      expectedUpdatedAt: second.updatedAt }, viewer)).rejects.toMatchObject({ code: 'SHORT_LINK_TAKEN' })
  })
})
