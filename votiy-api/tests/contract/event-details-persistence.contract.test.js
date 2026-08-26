import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createEventRepository } from '../../src/repositories/event-repository.js'

describe('event details persistence contract', () => {
  it('uses one active-owner timestamp CAS and atomically rebuilds search projection', async () => {
    const findOneAndUpdate = vi.fn().mockResolvedValue({ _id: new ObjectId() })
    const repository = createEventRepository({ collection: () => ({ findOneAndUpdate }) })
    const eventId = new ObjectId(); const ownerId = new ObjectId()
    const expected = new Date('2030-01-01T10:00:00Z'); const now = new Date('2030-01-01T11:00:00Z')
    await repository.updateDetails(eventId, ownerId, expected,
      { title: 'New Title', description: null, location: 'Main Hall' }, now)
    const [filter, update] = findOneAndUpdate.mock.calls[0]
    expect(filter).toEqual({ _id: eventId, ownerAccountId: ownerId, lifecycleStatus: 'active', updatedAt: expected })
    expect(update.$set).toMatchObject({ title: 'New Title', description: null, location: 'Main Hall',
      searchTitleNormalized: 'new title', searchDescriptionNormalized: '', searchLocationNormalized: 'main hall',
      updatedAt: now })
    expect(update.$set).not.toHaveProperty('_id')
    expect(update.$set).not.toHaveProperty('publicId')
  })
})
