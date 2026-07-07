import { describe, expect, it } from 'vitest'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

describe('event persistence contract', () => {
  it('defines event and registration validators plus required indexes', () => {
    expect(collectionDefinitions.events.indexes.map(({ name }) => name)).toEqual([
      'event_public_id_unique',
      'event_owner_recent',
    ])
    expect(collectionDefinitions.eventRegistrations.indexes.map(({ name }) => name)).toEqual([
      'registration_event_account_unique',
      'registration_account_status',
      'registration_event_active',
    ])
  })
})
