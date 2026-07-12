import { describe, expect, it } from 'vitest'
import { entryFixture, participantFixture } from '../support/entry-derived-participants.js'
import { toParticipantCard } from '../../src/domain/event-entry.js'

describe('participant projection', () => {
  it('keeps duplicate titles as distinct entries in stable order', () => {
    const ownerAccountId = entryFixture().ownerAccountId
    const entries = [entryFixture({ ownerAccountId, title: 'Pie' }), entryFixture({ ownerAccountId, title: 'Pie' })]
    const account = { _id: ownerAccountId, displayName: 'Peyton', emailNormalized: null }
    expect(toParticipantCard(entries, account)).toEqual(expect.objectContaining({
      email: null, entryCount: 2, entries: [expect.objectContaining({ title: 'Pie' }), expect.objectContaining({ title: 'Pie' })],
    }))
    expect(participantFixture({ entries: [] }).entryCount).toBe(0)
  })
})
