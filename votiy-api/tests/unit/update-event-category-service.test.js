import { describe, expect, it, vi } from 'vitest'
import { createEventCategoryService } from '../../src/services/event-category-service.js'

const timestamp = new Date('2026-07-19T12:00:00.000Z')
const savedAt = new Date('2026-07-19T13:00:00.000Z')
const viewer = { account: { _id: 'owner-1' } }
const event = { _id: 'event-1', ownerAccountId: 'owner-1', publicId: 'event', title: 'Event',
  registrationPolicy: 'admin_managed', createdAt: timestamp, updatedAt: timestamp, categories: [
    { _id: 'category-1', title: 'Category', titleNormalized: 'category', isDefault: true,
      createdAt: timestamp, updatedAt: timestamp },
  ] }
const entries = [
  { _id: 'entry-1', eventId: 'event-1', categoryId: 'category-1', ownerAccountId: 'account-1',
    title: 'First', status: 'active', createdAt: timestamp, updatedAt: timestamp },
  { _id: 'entry-2', eventId: 'event-1', categoryId: 'category-1', ownerAccountId: 'account-2',
    title: 'Second', status: 'active', createdAt: timestamp, updatedAt: timestamp },
]
const input = { eventId: 'event-1', categoryId: 'category-1', title: 'Renamed', expectedCategoryUpdatedAt: timestamp,
  entryTitles: entries.map((entry, index) => ({ entryId: entry._id, title: index ? entry.title : 'Changed',
    expectedUpdatedAt: timestamp })), idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' }

function harness() {
  const updatedEvent = { ...event, categories: [{ ...event.categories[0], title: 'Renamed', updatedAt: savedAt }] }
  const eventRepository = { findById: vi.fn().mockResolvedValue(event),
    updateCategoryTitle: vi.fn().mockResolvedValue(updatedEvent), touch: vi.fn().mockResolvedValue(updatedEvent) }
  const eventEntryRepository = { listActiveByEventAndCategory: vi.fn().mockResolvedValue(entries),
    updateTitles: vi.fn().mockResolvedValue(['entry-1']) }
  const idempotencyRepository = { find: vi.fn().mockResolvedValue(null), create: vi.fn() }
  const auditRepository = { append: vi.fn() }
  const service = createEventCategoryService({ eventRepository, eventEntryRepository, idempotencyRepository,
    auditRepository, digestRequest: () => 'digest', now: () => savedAt })
  return { service, eventRepository, eventEntryRepository, idempotencyRepository, auditRepository }
}

describe('update event category service', () => {
  it('atomically updates only effective titles and audits changed entries', async () => {
    const test = harness()
    await expect(test.service.updateCategory(input, viewer, { correlationId: 'correlation' })).resolves.toBeDefined()
    expect(test.eventRepository.updateCategoryTitle).toHaveBeenCalledOnce()
    expect(test.eventEntryRepository.updateTitles).toHaveBeenCalledWith([
      expect.objectContaining({ entryId: 'entry-1', title: 'Changed' }),
    ], savedAt, {})
    expect(test.auditRepository.append).toHaveBeenCalledOnce()
    expect(test.auditRepository.append.mock.calls[0][0]).not.toHaveProperty('title')
  })

  it('rejects stale entry snapshots before writes', async () => {
    const test = harness()
    test.eventEntryRepository.listActiveByEventAndCategory.mockResolvedValue([{ ...entries[0], updatedAt: savedAt }, entries[1]])
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(test.eventEntryRepository.updateTitles).not.toHaveBeenCalled()
  })

  it('supports no-op and idempotent replay without audits', async () => {
    const test = harness()
    const noOp = { ...input, title: 'Category', entryTitles: entries.map((entry) => ({ entryId: entry._id,
      title: entry.title, expectedUpdatedAt: timestamp })) }
    await test.service.updateCategory(noOp, viewer)
    expect(test.eventEntryRepository.updateTitles).toHaveBeenCalledWith([], savedAt, {})
    expect(test.auditRepository.append).not.toHaveBeenCalled()
    test.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'digest', resultReference: { eventId: 'event-1' } })
    await test.service.updateCategory(noOp, viewer)
    expect(test.idempotencyRepository.create).toHaveBeenCalledTimes(1)
  })

  it('denies anonymous, non-host, missing category, and changed idempotency payloads', async () => {
    const test = harness()
    await expect(test.service.updateCategory(input, null)).rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' })
    test.eventRepository.findById.mockResolvedValueOnce({ ...event, ownerAccountId: 'another-owner' })
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    test.eventRepository.findById.mockResolvedValueOnce({ ...event, categories: [] })
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    test.idempotencyRepository.find.mockResolvedValueOnce({ requestDigest: 'different', resultReference: { eventId: 'event-1' } })
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('rejects exact-set and category timestamp mismatches before persistence', async () => {
    const test = harness()
    test.eventEntryRepository.listActiveByEventAndCategory.mockResolvedValueOnce(entries.slice(0, 1))
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(test.eventRepository.updateCategoryTitle).not.toHaveBeenCalled()
    test.eventRepository.findById.mockResolvedValueOnce({ ...event, categories: [
      { ...event.categories[0], updatedAt: savedAt },
    ] })
    await expect(test.service.updateCategory(input, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('maps conditional entry write failure to conflict', async () => {
    const test = harness()
    test.eventEntryRepository.updateTitles.mockRejectedValueOnce(new Error('STALE_ENTRY_SNAPSHOT'))
    await expect(test.service.updateCategory({ ...input, title: 'Category' }, viewer)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(test.idempotencyRepository.create).not.toHaveBeenCalled()
  })
})
