import { describe, expect, it, vi } from 'vitest'
import { createEventCategoryService } from '../../src/services/event-category-service.js'

const at = new Date('2026-07-19T12:00:00.000Z')
const later = new Date('2026-07-19T13:00:00.000Z')
const viewer = { account: { _id: 'owner-1' } }
const categories = [
  { _id: 'cat-1', title: 'First', isDefault: true, status: 'active', createdAt: at, updatedAt: at },
  { _id: 'cat-2', title: 'Second', isDefault: false, status: 'active', createdAt: later, updatedAt: at },
]
const event = { _id: 'event-1', ownerAccountId: 'owner-1', publicId: 'event', title: 'Event',
  registrationPolicy: 'admin_managed', createdAt: at, updatedAt: at, categories }
const entries = [{ _id: 'entry-1', categoryId: 'cat-1', ownerAccountId: 'person-1',
  title: 'Entry', status: 'active', createdAt: at, updatedAt: at }]
const input = { eventId: 'event-1', categoryId: 'cat-1', expectedEventUpdatedAt: at,
  expectedCategoryUpdatedAt: at, activeEntries: [{ entryId: 'entry-1', expectedUpdatedAt: at }],
  idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' }

function harness(source = event) {
  const archived = { ...source, updatedAt: later, categories: source.categories.map((category) =>
    category._id === 'cat-1' ? { ...category, status: 'archived' } : { ...category, isDefault: true }) }
  const eventRepository = { findById: vi.fn().mockResolvedValueOnce(source).mockResolvedValue(archived),
    archiveCategory: vi.fn().mockResolvedValue(archived) }
  const eventEntryRepository = { listActiveByEventAndCategory: vi.fn().mockResolvedValue(entries),
    archiveByCategory: vi.fn().mockResolvedValue(['entry-1']), listActiveByEvent: vi.fn().mockResolvedValue([]) }
  const idempotencyRepository = { find: vi.fn().mockResolvedValue(null), create: vi.fn() }
  const auditRepository = { append: vi.fn() }
  const service = createEventCategoryService({ eventRepository, eventEntryRepository,
    idempotencyRepository, auditRepository, accountRepository: { findByIds: vi.fn().mockResolvedValue([]) },
    digestRequest: () => 'digest', now: () => later })
  return { service, eventRepository, eventEntryRepository, idempotencyRepository, auditRepository }
}

describe('archive event category service', () => {
  it('archives the category and exact active entries while promoting the oldest remainder', async () => {
    const test = harness()
    const result = await test.service.archiveCategory(input, viewer)
    expect(result.event.categories).toHaveLength(1)
    expect(test.eventRepository.archiveCategory).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'cat-1', categories: expect.arrayContaining([expect.objectContaining({ _id: 'cat-2', isDefault: true })]),
    }), {})
    expect(test.eventEntryRepository.archiveByCategory).toHaveBeenCalledWith(expect.objectContaining({
      entryIds: ['entry-1'], archivedByAccountId: 'owner-1' }), {})
  })

  it('refuses the final category and stale entry snapshots', async () => {
    const final = harness({ ...event, categories: [categories[0]] })
    await expect(final.service.archiveCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
    const stale = harness()
    stale.eventEntryRepository.listActiveByEventAndCategory.mockResolvedValue([{ ...entries[0], updatedAt: later }])
    await expect(stale.service.archiveCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('denies non-host access before writes', async () => {
    const test = harness()
    await expect(test.service.archiveCategory(input, { account: { _id: 'other' } }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(test.eventRepository.archiveCategory).not.toHaveBeenCalled()
  })

  it('replays the same idempotency digest and rejects a changed digest', async () => {
    const replay = harness()
    replay.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'digest',
      resultReference: { eventId: 'event-1' } })
    await expect(replay.service.archiveCategory(input, viewer)).resolves.toBeDefined()
    expect(replay.eventRepository.archiveCategory).not.toHaveBeenCalled()
    const mismatch = harness()
    mismatch.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'different',
      resultReference: { eventId: 'event-1' } })
    await expect(mismatch.service.archiveCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('maps conditional entry archival races to a conflict', async () => {
    const test = harness()
    test.eventEntryRepository.archiveByCategory.mockRejectedValue(new Error('STALE_CATEGORY_ENTRY_SNAPSHOT'))
    await expect(test.service.archiveCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
