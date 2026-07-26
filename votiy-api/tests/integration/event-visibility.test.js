import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventVisibilityService } from '../../src/services/event-visibility-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('event visibility with real MongoDB', () => {
  let mongo
  let repository
  let service
  let owner
  let event
  beforeEach(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
    repository = createEventRepository(mongo.database)
    const auditRepository = createAuditEventRepository(mongo.database)
    owner = new ObjectId()
    event = await repository.create({ schemaVersion: 4, ownerAccountId: owner, publicId: 'visibility-event',
      title: 'Visibility Event', now: new Date('2026-01-01T00:00:00Z') })
    service = createEventVisibilityService({
      eventRepository: repository, eventEntryRepository: { listActiveByEvent: async () => [] },
      auditRepository, now: () => new Date('2026-01-02T00:00:00Z'),
    })
  })
  afterEach(async () => mongo?.cleanup())

  it('allows host transitions, denies non-hosts, returns private summary, and audits once', async () => {
    const changed = await service.setVisibility({ eventId: String(event._id), visibility: 'PRIVATE',
      expectedUpdatedAt: event.updatedAt }, { account: { _id: owner } }, { correlationId: 'success-id' })
    expect(changed.visibility).toBe('PRIVATE')
    const summary = await service.detail(event.publicId, { account: { _id: new ObjectId() } })
    expect(summary.__typename).toBe('PrivateEventSummary')
    expect(summary).not.toHaveProperty('location')
    await expect(service.setVisibility({ eventId: String(event._id), visibility: 'PUBLIC',
      expectedUpdatedAt: changed.updatedAt }, { account: { _id: new ObjectId() } },
    { correlationId: 'denied-id' })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(await mongo.database.collection('auditEvents').countDocuments()).toBe(2)
  })
})
