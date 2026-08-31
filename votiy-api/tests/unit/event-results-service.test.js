import { describe, expect, it, vi } from 'vitest'
import { createEventResultsService } from '../../src/services/event-results-service.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

function setup() {
  const event = votingEventFixture()
  const eventRepository = { findByPublicId: vi.fn().mockResolvedValue(event) }
  const eventEntryRepository = { listByEvent: vi.fn().mockResolvedValue([]) }
  const ballotRepository = { listByEvent: vi.fn().mockResolvedValue([]) }
  const auditRepository = { append: vi.fn() }; const logger = { info: vi.fn(), warn: vi.fn() }
  return { service: createEventResultsService({ eventRepository, eventEntryRepository, ballotRepository,
    auditRepository, logger, now: () => new Date('2030-01-01T13:00:00Z') }), eventRepository,
  eventEntryRepository, ballotRepository, auditRepository, logger }
}

describe('event results service', () => {
  it('returns host-owned zero results and audits aggregate metadata', async () => {
    const test = setup(); const result = await test.service.results({ publicId: 'voting-event-fixture' },
      { account: { _id: votingTestIds.hostId } }, { correlationId: 'results-1' })
    expect(result).toMatchObject({ votesReceived: 0, calculatedAt: new Date('2030-01-01T13:00:00Z'),
      event: { isOwner: true } })
    expect(test.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({ name: 'voting.results_viewed',
      metadata: { ballotCount: 0, categoryCount: 1 } }))
  })

  it('rejects anonymous and non-owner viewers before reading ballots', async () => {
    const anonymous = setup()
    await expect(anonymous.service.results({ publicId: 'voting-event-fixture' }, null))
      .rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' })
    expect(anonymous.ballotRepository.listByEvent).not.toHaveBeenCalled()
    const nonOwner = setup()
    await expect(nonOwner.service.results({ publicId: 'voting-event-fixture' },
      { account: { _id: votingTestIds.voterId } })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(nonOwner.ballotRepository.listByEvent).not.toHaveBeenCalled()
    expect(nonOwner.logger.warn).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'denied' }), expect.any(String))
  })
})
