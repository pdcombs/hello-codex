import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createEventEntryDocument } from '../../src/domain/event-entry.js'
import { createEventEntryService } from '../../src/services/event-entry-service.js'

const now = new Date('2026-07-19T12:00:00.000Z')
const host = { _id: new ObjectId(), displayName: 'Host' }
const account = { _id: new ObjectId(), displayName: 'Person', emailNormalized: 'person@example.test', phoneNormalized: null }
const event = { _id: new ObjectId(), ownerAccountId: host._id }
const categoryId = new ObjectId()
const uuid = '123e4567-e89b-42d3-a456-426614174000'

function harness() {
  const stored = []
  const eventRepository = { findById: vi.fn(async () => event), requireCategoryIds: vi.fn(async () => true) }
  const eventEntryRepository = {
    createMany: vi.fn(async (input) => {
      const created = input.entries.map((entry) => createEventEntryDocument({ ...entry, eventId: input.eventId,
        ownerAccountId: input.ownerAccountId, createdByAccountId: input.createdByAccountId, now }))
      stored.push(...created); return created
    }),
    findByIds: vi.fn(async (ids) => stored.filter((entry) => ids.includes(entry._id))),
    listActiveByEventAndOwner: vi.fn(async (_eventId, ownerId) => stored.filter((entry) => String(entry.ownerAccountId) === String(ownerId))),
    listRecentOwners: vi.fn(async () => [{ ownerAccountId: account._id, latestEntryCreatedAt: now }]),
    latestActiveByEventAndOwners: vi.fn(async () => []),
  }
  const accountRepository = {
    findById: vi.fn(async (id) => String(id) === String(account._id) ? account : null),
    findByIds: vi.fn(async () => [account]),
    findByEmailNormalized: vi.fn(async () => null),
    findByPhoneNormalized: vi.fn(async () => null),
    searchByContactPrefix: vi.fn(async () => [account]),
    createProvisional: vi.fn(async (input) => ({ _id: new ObjectId(), ...input })),
  }
  const idempotencyRepository = { find: vi.fn(async () => null), create: vi.fn(async () => undefined) }
  const logger = { info: vi.fn() }
  const service = createEventEntryService({ eventRepository, eventEntryRepository, accountRepository,
    idempotencyRepository, withTransaction: (operation) => operation(null), now: () => now,
    digestRequest: () => 'digest', logger })
  return { service, stored, eventRepository, eventEntryRepository, accountRepository, idempotencyRepository, logger }
}

describe('single event entry service', () => {
  it('creates one existing-owner entry in fixed category', async () => {
    const app = harness()
    const result = await app.service.createEntry({ eventId: String(event._id), categoryId: String(categoryId),
      title: 'Pie', accountId: String(account._id), idempotencyKey: uuid }, { account: host })
    expect(result.createdEntries).toHaveLength(1)
    expect(result.affectedParticipant).toMatchObject({ accountId: String(account._id), entryCount: 1 })
    expect(app.idempotencyRepository.create).toHaveBeenCalledOnce()
  })

  it('creates provisional owner and entry together', async () => {
    const app = harness()
    const result = await app.service.createEntry({ eventId: String(event._id), categoryId: String(categoryId),
      title: 'Cake', provisionalOwner: { displayName: 'New', email: 'new@example.test' },
      idempotencyKey: uuid }, { account: host })
    expect(result.provisionalCreated).toBe(true)
    expect(app.accountRepository.createProvisional).toHaveBeenCalledWith(expect.objectContaining({
      emailNormalized: 'new@example.test', displayName: 'New',
    }), expect.any(Object))
  })

  it('returns recent and searched choices without logging contact values', async () => {
    const app = harness()
    await expect(app.service.entryOwnerChoices({ eventId: String(event._id), search: null, first: 10 }, { account: host }))
      .resolves.toMatchObject({ choices: [{ displayName: 'Person', isEventParticipant: true }] })
    await app.service.entryOwnerChoices({ eventId: String(event._id), search: 'per', first: 10 }, { account: host })
    expect(app.accountRepository.searchByContactPrefix).toHaveBeenCalledWith({ type: 'email', prefix: 'per', limit: 10 })
    expect(JSON.stringify(app.logger.info.mock.calls)).not.toContain('person@example.test')
  })

  it('rejects invalid category and conflicting idempotent replay', async () => {
    const app = harness()
    app.eventRepository.requireCategoryIds.mockResolvedValue(false)
    await expect(app.service.createEntry({ eventId: String(event._id), categoryId: String(categoryId), title: 'Pie',
      accountId: String(account._id), idempotencyKey: uuid }, { account: host }))
      .rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    app.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'other', resultReference: {} })
    await expect(app.service.createEntry({ eventId: String(event._id), categoryId: String(categoryId), title: 'Pie',
      accountId: String(account._id), idempotencyKey: uuid }, { account: host }))
      .rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
