import { describe, expect, it } from 'vitest'
import { votingAccessText, votingMethodText, votingWindow } from '../../src/features/events/event-voting-summary.js'

describe('event voting summary mapping', () => {
  it.each([
    ['CODE', true, 'Voters need a code to vote.'],
    ['CODE', false, 'This event requires a registered code to vote.'],
    ['ACCOUNT', true, 'Voters need a completed account to vote.'],
    ['ACCOUNT', false, 'You need a completed account to vote in this event.'],
    ['UNRESTRICTED', true, 'Anyone with the event link can vote.'],
    ['UNRESTRICTED', false, 'Anyone with this event link can vote.'],
  ])('maps %s owner=%s', (policy, owner, text) => expect(votingAccessText(policy, owner)).toBe(text))

  it('maps event-wide methods and fails closed', () => {
    expect(votingMethodText({ method: 'SINGLE' }, false)).toBe('Choose one entry in each category.')
    expect(votingMethodText({ method: 'RANKING' }, true)).toBe('Voters rank all entries in each category.')
    expect(votingMethodText({ method: 'MULTIPLE', minimumSelections: 1, maximumSelections: 3 }, false))
      .toBe('Choose 1–3 entries in each category.')
    expect(votingMethodText({ method: 'MULTIPLE', minimumSelections: 2, maximumSelections: 4 }, true))
      .toBe('Voters choose 2–4 entries in each category.')
    expect(votingMethodText({ method: 'MULTIPLE', minimumSelections: null, maximumSelections: 3 }, false)).toBeNull()
    expect(votingMethodText(null, false)).toBeNull()
    expect(votingMethodText({ method: 'UNKNOWN' }, false)).toBeNull()
    expect(votingAccessText('UNKNOWN', false)).toBeNull()
  })

  it('formats complete valid window only', () => {
    const window = votingWindow({ opensAt: '2030-01-01T12:00:00Z', closesAt: '2030-01-01T14:00:00Z' }, 'en-US')
    expect(window.opensText).toMatch(/2030/)
    expect(window.opensText).toMatch(/(UTC|GMT|[A-Z]{2,5})/)
    expect(votingWindow({ opensAt: 'bad', closesAt: '2030-01-01T14:00:00Z' })).toBeNull()
    expect(votingWindow({ opensAt: '2030-01-01T12:00:00Z', closesAt: 'bad' })).toBeNull()
    expect(votingWindow({ opensAt: '2030-01-01T12:00:00Z' })).toBeNull()
    expect(votingWindow(null)).toBeNull()
  })
})
