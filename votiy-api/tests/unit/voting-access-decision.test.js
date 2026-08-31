import { describe, expect, it, vi } from 'vitest'
import { createEventVotingService } from '../../src/services/event-voting-service.js'
import { openVotingEvent, closedVotingEvent } from '../support/open-close-voting-fixtures.js'
import { votingCodeFixture, votingTestIds } from '../support/event-voting-rules.js'

function setup(event = openVotingEvent()) {
  const eventRepository = { findById: vi.fn().mockResolvedValue(event), findByPublicId: vi.fn().mockResolvedValue(event) }
  const eventEntryRepository = { listActiveByEvent: vi.fn().mockResolvedValue([]), findByIds: vi.fn().mockResolvedValue([]) }
  const ballotRepository = { countByAccount: vi.fn().mockResolvedValue(0), countByBrowserMarker: vi.fn().mockResolvedValue(0),
    findLatestByAccount: vi.fn().mockResolvedValue(null), findLatestByBrowserMarker: vi.fn().mockResolvedValue(null),
    findByAccessCode: vi.fn().mockResolvedValue(null) }
  const voterAccessRepository = { find: vi.fn().mockResolvedValue(null), findByBrowser: vi.fn().mockResolvedValue(null), grant: vi.fn() }
  const accessCodeRepository = { findUnused: vi.fn().mockResolvedValue(votingCodeFixture()), consume: vi.fn().mockResolvedValue({}) }
  const auditRepository = { append: vi.fn() }
  const service = createEventVotingService({ eventRepository, eventEntryRepository, ballotRepository,
    idempotencyRepository: {}, auditRepository, accountRepository: { findByIds: vi.fn().mockResolvedValue([]) },
    voterAccessRepository, accessCodeRepository,
    digestCode: (_eventId, code) => `code:${code}`, digestBrowserMarker: (marker) => `browser:${marker}`,
    generateBrowserMarker: () => 'new-browser-marker', votingCodeEncryptionKey: '0'.repeat(64),
    withTransaction: (operation) => operation({ test: true }), now: () => new Date('2030-01-01T13:00:00Z') })
  return { service, eventRepository, eventEntryRepository, ballotRepository, voterAccessRepository, accessCodeRepository, auditRepository }
}

describe('voting access decisions', () => {
  it('denies closed and allows unrestricted voting', async () => {
    const closed = setup(closedVotingEvent())
    expect((await closed.service.requestAccess({ eventId: String(votingTestIds.eventId) })).access.decision).toBe('CLOSED')
    const open = setup()
    expect((await open.service.requestAccess({ eventId: String(votingTestIds.eventId) })).access.allowed).toBe(true)
  })
  it('returns sign-in, completion, and repeat requirements for account policy', async () => {
    const event = openVotingEvent({ votingRules: { ...openVotingEvent().votingRules,
      accessPolicy: 'account', maxBallotsPerAccount: 1 } })
    const test = setup(event)
    expect((await test.service.requestAccess({ eventId: String(event._id) })).access.decision).toBe('SIGN_IN_REQUIRED')
    const incomplete = { account: { _id: votingTestIds.voterId, emailNormalized: 'voter@example.test', phoneNormalized: null } }
    expect((await test.service.requestAccess({ eventId: String(event._id) }, incomplete)).access.decision).toBe('ACCOUNT_COMPLETION_REQUIRED')
    test.ballotRepository.countByAccount.mockResolvedValue(1)
    const complete = { account: { ...incomplete.account, phoneNormalized: '+15555550123' } }
    expect((await test.service.requestAccess({ eventId: String(event._id) }, complete)).access.decision).toBe('REPEAT_LIMIT_REACHED')
  })
  it('enforces browser repeat history', async () => {
    const event = openVotingEvent({ votingRules: { ...openVotingEvent().votingRules,
      unrestrictedRepeatPolicy: 'browser_limited' } })
    const test = setup(event); test.ballotRepository.countByBrowserMarker.mockResolvedValue(1)
    const result = await test.service.requestAccess({ eventId: String(event._id) }, null, { browserMarker: 'browser-1' })
    expect(result.access.decision).toBe('REPEAT_LIMIT_REACHED')
  })
  it('requires then atomically claims code and browser grant', async () => {
    const event = openVotingEvent({ votingRules: { ...openVotingEvent().votingRules,
      accessPolicy: 'code', codeRequiresCompletedAccount: false } })
    const test = setup(event)
    const required = await test.service.requestAccess({ eventId: String(event._id) })
    expect(required.access).toMatchObject({ decision: 'CODE_REQUIRED', requirements: { mayRetryCode: true } })
    const allowed = await test.service.requestAccess({ eventId: String(event._id), accessCode: 'ABC123' })
    expect(allowed.access.allowed).toBe(true); expect(allowed.browserMarker).toBe('new-browser-marker')
    expect(test.accessCodeRepository.consume).toHaveBeenCalledWith(expect.objectContaining({ accountId: null }), expect.anything())
    expect(test.voterAccessRepository.grant).toHaveBeenCalledWith(expect.objectContaining({
      browserMarkerDigest: 'browser:new-browser-marker', source: 'code' }), expect.anything())
  })
  it('requires a new code after the current grant has a ballot', async () => {
    const event = openVotingEvent({ votingRules: { ...openVotingEvent().votingRules,
      accessPolicy: 'code', codeRequiresCompletedAccount: false } })
    const test = setup(event); const code = votingCodeFixture()
    test.voterAccessRepository.findByBrowser.mockResolvedValue({ status: 'active', codeId: code._id })
    test.ballotRepository.findByAccessCode.mockResolvedValue({ _id: votingTestIds.entryId, accessCodeId: code._id })
    const required = await test.service.requestAccess({ eventId: String(event._id) }, null,
      { browserMarker: 'browser-1', correlationId: 'repeat-code' })
    expect(required.access).toMatchObject({ decision: 'CODE_REQUIRED', allowed: false,
      requirements: { codeRequired: true, mayRetryCode: true } })
    expect(test.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({
      name: 'voting.code_reuse_denied', outcome: 'denied', metadata: { reasonCode: 'ACCESS_CODE_USED' },
    }))
    test.accessCodeRepository.findUnused = vi.fn().mockResolvedValue(votingCodeFixture())
    const rotated = await test.service.requestAccess({ eventId: String(event._id), accessCode: 'NEW123' }, null,
      { browserMarker: 'browser-1' })
    expect(rotated.access.allowed).toBe(true)
    expect(test.voterAccessRepository.grant).toHaveBeenCalledWith(expect.objectContaining({
      browserMarkerDigest: 'browser:browser-1', codeId: expect.anything(),
    }), expect.anything())
  })
  it('privately projects a legacy ballot using current titles', async () => {
    const event = openVotingEvent(); const test = setup(event)
    const legacy = { _id: votingTestIds.entryId, eventId: event._id, accountId: null,
      rulesVersion: 1, categoryBallots: [{ categoryId: votingTestIds.categoryId,
        method: 'single', entryIds: [votingTestIds.entryId] }], submittedAt: new Date('2030-01-01T13:00:00Z') }
    test.ballotRepository.findLatestByBrowserMarker.mockResolvedValue(legacy)
    test.eventEntryRepository.findByIds.mockResolvedValue([{ _id: votingTestIds.entryId,
      categoryId: votingTestIds.categoryId, title: 'Legacy entry', status: 'archived' }])
    const view = await test.service.ballotView({ publicId: event.publicId }, null, { browserMarker: 'legacy-browser' })
    expect(view.submittedBallot).toMatchObject({ votingStateVersion: 1, categoryBallots: [{
      categoryTitle: 'Category', entries: [{ entryTitle: 'Legacy entry', selectionOrder: 0 }],
    }] })
  })
})
