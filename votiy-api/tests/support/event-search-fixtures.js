import { ObjectId } from 'mongodb'
import { createEventSearchProjection } from '../../src/domain/event-search.js'
import { createEventDocument, withEventVersion3, withEventVersion4 } from '../../src/domain/event.js'

export function eventSearchFixture(overrides = {}) {
  const base = withEventVersion4(withEventVersion3(createEventDocument({
    ownerAccountId: new ObjectId(), publicId: crypto.randomUUID(),
    title: 'Motorcycle Show', description: 'Custom bikes and awards', location: 'Rogers AR',
    now: new Date('2026-01-01T00:00:00Z'),
  })))
  const event = { ...base, ...overrides }
  return { ...event, ...createEventSearchProjection(event) }
}

export const searchFixtures = Object.freeze({
  public: eventSearchFixture(),
  private: eventSearchFixture({ visibility: 'private', title: 'Private Motorcycle Show' }),
  unlisted: eventSearchFixture({ visibility: 'unlisted' }),
  archived: eventSearchFixture({ lifecycleStatus: 'archived', archivedAt: new Date() }),
})
