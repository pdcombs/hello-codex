import { describe, expect, it, vi } from 'vitest'
import { createEventVotingStateService } from '../../src/services/event-voting-state-service.js'
import { openVotingEvent, closedVotingEvent } from '../support/open-close-voting-fixtures.js'
import { votingTestIds } from '../support/event-voting-rules.js'

function setup(event = closedVotingEvent()) {
  const eventRepository = { findById: vi.fn().mockResolvedValue(event), transitionVotingState: vi.fn() }
  eventRepository.transitionVotingState.mockImplementation(async (_id, _owner, _version, _status, state) => ({ ...event, votingState: state }))
  const eventEntryRepository = { listActiveByEvent: vi.fn().mockResolvedValue([{ _id: votingTestIds.entryId }]) }
  const accessCodeRepository = { countUnusedByEvent: vi.fn().mockResolvedValue(0) }
  const auditRepository = { append: vi.fn() }
  return { service: createEventVotingStateService({ eventRepository, eventEntryRepository,
    accessCodeRepository, auditRepository, now: () => new Date('2030-01-01T03:00:00Z') }),
  eventRepository, eventEntryRepository, accessCodeRepository, auditRepository }
}

describe('event voting state service', () => {
  it('opens configured event and warns when code inventory empty', async () => {
    const event = closedVotingEvent({ votingRules: { ...closedVotingEvent().votingRules, accessPolicy: 'code' } })
    const test = setup(event)
    const result = await test.service.setStatus({ eventId: String(event._id), status: 'OPEN', expectedVersion: 2 },
      { account: { _id: votingTestIds.hostId } }, { correlationId: 'state-1' })
    expect(result.hasUnusedCodes).toBe(false); expect(result.event.votingState.status).toBe('OPEN')
    expect(test.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({ name: 'voting.state_opened' }))
  })
  it('rejects no entries, non-owner, same-state, and stale version', async () => {
    const noEntries = setup(); noEntries.eventEntryRepository.listActiveByEvent.mockResolvedValue([])
    await expect(noEntries.service.setStatus({ eventId: String(votingTestIds.eventId), status: 'OPEN', expectedVersion: 2 },
      { account: { _id: votingTestIds.hostId } })).rejects.toMatchObject({
        code: 'VOTING_REQUIRES_ENTRY', message: 'One event entry and participant is required for voting.',
      })
    const wrong = setup(); await expect(wrong.service.setStatus({ eventId: String(votingTestIds.eventId), status: 'OPEN', expectedVersion: 2 },
      { account: { _id: votingTestIds.voterId } })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    const same = setup(openVotingEvent()); await expect(same.service.setStatus({ eventId: String(votingTestIds.eventId), status: 'OPEN', expectedVersion: 1 },
      { account: { _id: votingTestIds.hostId } })).rejects.toMatchObject({ code: 'CONFLICT' })
    const stale = setup(); await expect(stale.service.setStatus({ eventId: String(votingTestIds.eventId), status: 'OPEN', expectedVersion: 99 },
      { account: { _id: votingTestIds.hostId } })).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
