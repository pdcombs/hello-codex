import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createEventPhotoRepository } from '../../src/repositories/event-photo-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createEventPhotoService } from '../../src/services/event-photo-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('event photo lifecycle with real MongoDB', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('uploads, replaces, publicly reads, deletes, audits, and denies non-owner', async () => {
    const accounts = createAccountRepository(mongo.database)
    const events = createEventRepository(mongo.database)
    const photos = createEventPhotoRepository(mongo.database)
    const owner = await accounts.createPending({ displayName: 'Owner', emailNormalized: 'photo-owner@example.test', passwordHash: 'hash' })
    const other = await accounts.createPending({ displayName: 'Other', emailNormalized: 'photo-other@example.test', passwordHash: 'hash' })
    const event = await events.create({ schemaVersion: 3, ownerAccountId: owner._id, publicId: 'photo-event', title: 'Photo event' })
    const service = createEventPhotoService({
      eventRepository: events,
      photoRepository: photos,
      idempotencyRepository: createIdempotencyRepository(mongo.database),
      auditRepository: createAuditEventRepository(mongo.database),
    })
    const first = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#1289dc' } }).jpeg().toBuffer()
    const uploaded = await service.upload({ eventId: String(event._id), bytes: first, contentType: 'image/jpeg',
      idempotencyKey: randomUUID(), viewer: { account: owner }, correlationId: 'photo-upload' })
    expect(uploaded).toMatchObject({ created: true, photo: { revision: 1, width: 600, height: 600 } })
    expect((await service.read('photo-event')).byteLength).toBeLessThanOrEqual(350 * 1024)

    const replacement = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#31b57b' } }).png().toBuffer()
    const replaced = await service.upload({ eventId: String(event._id), bytes: replacement, contentType: 'image/png',
      idempotencyKey: randomUUID(), viewer: { account: owner }, correlationId: 'photo-replace' })
    expect(replaced).toMatchObject({ created: false, photo: { revision: 2 } })
    await expect(service.upload({ eventId: String(event._id), bytes: first, contentType: 'image/jpeg',
      idempotencyKey: randomUUID(), viewer: { account: other }, correlationId: 'photo-denied' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(await service.remove({ eventId: String(event._id), idempotencyKey: randomUUID(),
      viewer: { account: owner }, correlationId: 'photo-delete' })).toEqual({ deleted: true, deletedRevision: 2 })
    expect(await service.read('photo-event')).toBeNull()
    expect(await mongo.database.collection('auditEvents').countDocuments({ name: /^event\.photo_/ })).toBe(3)
  })
})
