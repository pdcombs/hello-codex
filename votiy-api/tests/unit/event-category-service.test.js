import { describe, expect, it, vi } from 'vitest'
import { createEventCategoryService } from '../../src/services/event-category-service.js'

const owner = { account: { _id: 'owner-1' } }
const event = { _id: 'event-1', ownerAccountId: 'owner-1', title: "Peyton's event", categories: [
  { _id: 'category-1', title: "Peyton's event participants", titleNormalized: "peyton's event participants", isDefault: true },
] }
const addInput = { eventId: 'event-1', title: 'Desserts', idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014' }

function harness() {
  const saved = { ...event, categories: [...event.categories, { _id: 'category-2', title: 'Desserts', titleNormalized: 'desserts' }] }
  const eventRepository = { findById: vi.fn().mockResolvedValue(event), appendCategory: vi.fn().mockResolvedValue(saved),
    renameCategory: vi.fn().mockResolvedValue(saved) }
  const idempotencyRepository = { find: vi.fn().mockResolvedValue(null), create: vi.fn() }
  return { eventRepository, idempotencyRepository, service: createEventCategoryService({ eventRepository, idempotencyRepository,
    digestRequest: vi.fn().mockReturnValue('digest'), now: () => new Date('2026-07-01') }) }
}

describe('event category service', () => {
  it('adds normalized categories and supports idempotent retry', async () => {
    const test = harness()
    await expect(test.service.addCategory(addInput, owner)).resolves.toMatchObject({ event: { categories: expect.any(Array) } })
    expect(test.eventRepository.appendCategory).toHaveBeenCalledWith('event-1', 'owner-1', expect.objectContaining({ titleNormalized: 'desserts' }))
    test.idempotencyRepository.find.mockResolvedValue({ requestDigest: 'digest', resultReference: { eventId: 'event-1' } })
    await test.service.addCategory(addInput, owner)
    expect(test.eventRepository.appendCategory).toHaveBeenCalledTimes(1)
  })

  it('renames categories and rejects blank, missing, duplicate, limit, and every ownership branch', async () => {
    const test = harness()
    await expect(test.service.renameCategory({ ...addInput, categoryId: 'category-1' }, owner)).resolves.toBeDefined()
    await expect(test.service.addCategory({ ...addInput, title: ' ' }, owner)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    await expect(test.service.addCategory(addInput, null)).rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' })
    test.eventRepository.findById.mockResolvedValueOnce(null)
    await expect(test.service.addCategory(addInput, owner)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    test.eventRepository.findById.mockResolvedValueOnce({ ...event, ownerAccountId: 'other' })
    await expect(test.service.addCategory(addInput, owner)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    test.eventRepository.appendCategory.mockResolvedValueOnce(null)
    await expect(test.service.addCategory(addInput, owner)).rejects.toMatchObject({ code: 'CONFLICT' })
    test.eventRepository.findById.mockResolvedValueOnce({ ...event, categories: Array.from({ length: 100 }, (_, index) => ({ _id: `c-${index}` })) })
    test.eventRepository.appendCategory.mockResolvedValueOnce(null)
    await expect(test.service.addCategory(addInput, owner)).rejects.toThrow('at most 100 categories')
  })
})
