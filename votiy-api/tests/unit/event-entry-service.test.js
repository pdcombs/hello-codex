import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createEventEntryDocument } from '../../src/domain/event-entry.js'
import { createEventEntryService } from '../../src/services/event-entry-service.js'

const NOW = new Date('2026-07-12T12:00:00.000Z')
const owner = { _id: new ObjectId(), displayName: 'Host', emailNormalized: 'host@example.test',
  verificationStatus: 'verified' }
const participant = { _id: new ObjectId(), displayName: 'Peyton', emailNormalized: 'peyton@example.test' }
const event = { _id: new ObjectId(), ownerAccountId: owner._id, registrationPolicy: 'open' }
const categoryId = new ObjectId()
const input = { eventId: String(event._id), displayName: 'Peyton', email: participant.emailNormalized,
  phone: null, entries: [{ title: 'Pie', categoryId: String(categoryId) }],
  idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }

function harness() {
  let entries = []
  const eventRepository = { findById: vi.fn().mockResolvedValue(event), requireCategoryIds: vi.fn().mockResolvedValue(true) }
  const eventEntryRepository = {
    findByIds: vi.fn(async (ids) => entries.filter((entry) => ids.some((id) => String(id) === String(entry._id)))),
    listActiveByEvent: vi.fn(async () => entries.filter(({ status }) => status === 'active')),
    listActiveByEventAndOwner: vi.fn(async (_eventId, accountId) => entries.filter((entry) =>
      entry.status === 'active' && String(entry.ownerAccountId) === String(accountId))),
    createMany: vi.fn(async ({ eventId, ownerAccountId, createdByAccountId, entries: requested }) => {
      const created = requested.map((item) => createEventEntryDocument({ ...item, eventId, ownerAccountId,
        createdByAccountId, now: NOW }))
      entries.push(...created)
      return created
    }),
    archiveOne: vi.fn(async ({ entryId, archivedByAccountId }) => {
      const index = entries.findIndex((entry) => String(entry._id) === String(entryId) && entry.status === 'active')
      if (index < 0) return null
      entries[index] = { ...entries[index], status: 'archived', archiveReason: 'entry_removed',
        archivedAt: NOW, archivedByAccountId, updatedAt: NOW }
      return entries[index]
    }),
    archiveByOwner: vi.fn(async ({ ownerAccountId, archivedByAccountId }) => {
      const found = entries.filter((entry) => entry.status === 'active' && String(entry.ownerAccountId) === String(ownerAccountId))
      entries = entries.map((entry) => found.includes(entry) ? { ...entry, status: 'archived',
        archiveReason: 'participant_removed', archivedAt: NOW, archivedByAccountId, updatedAt: NOW } : entry)
      return found
    }),
  }
  const accountRepository = { findByEmailNormalized: vi.fn().mockResolvedValue(participant),
    findById: vi.fn(async (id) => String(id) === String(owner._id) ? owner : participant),
    findByIds: vi.fn().mockResolvedValue([participant]), createProvisional: vi.fn() }
  const idempotencyRepository = { find: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(undefined) }
  const service = createEventEntryService({ eventRepository, eventEntryRepository, accountRepository,
    idempotencyRepository, digestRequest: vi.fn().mockReturnValue('digest'), now: () => NOW,
    withTransaction: (operation) => operation(null), logger: { info: vi.fn() } })
  return { service, eventEntryRepository, eventRepository, idempotencyRepository, accountRepository,
    setEntries(value) { entries = value }, entries: () => entries }
}

describe('event entry service', () => {
  let app
  beforeEach(() => { app = harness() })

  it('creates entries and derives exactly one participant without registration state', async () => {
    const result = await app.service.addParticipant(input, { account: owner })
    expect(result.createdEntries).toHaveLength(1)
    expect(result.affectedParticipant).toMatchObject({ accountId: String(participant._id), entryCount: 1 })
    expect(app.idempotencyRepository.create).toHaveBeenCalledOnce()
    const listed = await app.service.listParticipants({ eventId: String(event._id) }, { account: owner })
    expect(listed.participants).toHaveLength(1)
  })

  it('excludes pre-archived entries and isolates other events', async () => {
    const archived = createEventEntryDocument({ eventId: event._id, categoryId, ownerAccountId: participant._id,
      createdByAccountId: owner._id, title: 'Old', status: 'archived', archiveReason: 'entry_removed',
      archivedAt: NOW, archivedByAccountId: owner._id, now: NOW })
    app.setEntries([archived])
    const listed = await app.service.listParticipants({ eventId: String(event._id) }, { account: owner })
    expect(listed.participants).toEqual([])
  })

  it('archives one entry, then the final entry removes derived participation', async () => {
    const created = await app.service.addParticipant({ ...input, entries: [
      { title: 'Pie', categoryId: String(categoryId) }, { title: 'Cake', categoryId: String(categoryId) },
    ] }, { account: owner })
    const first = await app.service.archiveEntry({ eventId: String(event._id), entryId: created.createdEntries[0].id,
      idempotencyKey: '223e4567-e89b-42d3-a456-426614174000' }, { account: owner })
    expect(first.affectedParticipant.entryCount).toBe(1)
    const last = await app.service.archiveEntry({ eventId: String(event._id), entryId: created.createdEntries[1].id,
      idempotencyKey: '323e4567-e89b-42d3-a456-426614174000' }, { account: owner })
    expect(last.affectedParticipant).toBeNull()
    expect(app.entries().every(({ status }) => status === 'archived')).toBe(true)
  })

  it('archives all participant entries and denies non-owners', async () => {
    await app.service.addParticipant({ ...input, entries: [
      { title: 'Pie', categoryId: String(categoryId) }, { title: 'Cake', categoryId: String(categoryId) },
    ] }, { account: owner })
    const result = await app.service.archiveParticipantEntries({ eventId: String(event._id),
      accountId: String(participant._id), idempotencyKey: '423e4567-e89b-42d3-a456-426614174000' }, { account: owner })
    expect(result.archivedEntryIds).toHaveLength(2)
    await expect(app.service.listParticipants({ eventId: String(event._id) }, { account: { _id: new ObjectId() } }))
      .rejects.toMatchObject({ code: ErrorCode.FORBIDDEN })
  })

  it('returns field validation and category failures without writes', async () => {
    await expect(app.service.addParticipant({ ...input, email: 'bad' }, { account: owner }))
      .rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED })
    app.eventRepository.requireCategoryIds.mockResolvedValue(false)
    await expect(app.service.addParticipant({ ...input,
      idempotencyKey: '523e4567-e89b-42d3-a456-426614174000' }, { account: owner }))
      .rejects.toMatchObject({ code: ErrorCode.VALIDATION_FAILED })
    expect(app.eventEntryRepository.createMany).not.toHaveBeenCalled()
  })

  it('replays matching idempotent creation and rejects digest conflicts', async () => {
    const first = await app.service.addParticipant(input, { account: owner })
    app.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'digest',
      resultReference: { entryIds: first.createdEntries.map(({ id }) => id) } })
    await expect(app.service.addParticipant(input, { account: owner })).resolves.toMatchObject({
      affectedParticipant: { entryCount: 1 },
    })
    app.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'different', resultReference: {} })
    await expect(app.service.addParticipant(input, { account: owner }))
      .rejects.toMatchObject({ code: ErrorCode.CONFLICT })
  })

  it('rejects anonymous, missing events, and already archived targets', async () => {
    await expect(app.service.listParticipants({ eventId: String(event._id) }, null))
      .rejects.toMatchObject({ code: ErrorCode.AUTHENTICATION_REQUIRED })
    app.eventRepository.findById.mockResolvedValue(null)
    await expect(app.service.listParticipants({ eventId: String(event._id) }, { account: owner }))
      .rejects.toMatchObject({ code: ErrorCode.NOT_FOUND })
    app.eventRepository.findById.mockResolvedValue(event)
    await expect(app.service.archiveEntry({ eventId: String(event._id), entryId: String(new ObjectId()),
      idempotencyKey: '623e4567-e89b-42d3-a456-426614174000' }, { account: owner }))
      .rejects.toMatchObject({ code: ErrorCode.CONFLICT })
  })
})
