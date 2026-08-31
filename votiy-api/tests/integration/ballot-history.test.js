import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { createBallotSubmissionRepository } from '../../src/repositories/ballot-submission-repository.js'
import { createEventEntryRepository } from '../../src/repositories/event-entry-repository.js'
import { createEventRepository } from '../../src/repositories/event-repository.js'
import { createEventVotingService } from '../../src/services/event-voting-service.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'
import { votingEventFixture, votingTestIds } from '../support/event-voting-rules.js'

describe('private ballot history', () => {
  let mongo; let service; let event; let accountId
  const marker = 'history-browser'; const digest = `digest:${marker}`
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    event = votingEventFixture({ publicId: 'closed-history', votingState: {
      ...votingEventFixture().votingState, status: 'closed', closedAt: new Date('2030-01-02'), version: 2,
    } })
    await mongo.database.collection('events').insertOne(event)
    accountId = new ObjectId()
    const makeBallot = ({ id, accountId: owner = null, browserMarkerDigest = null, submittedAt }) => ({
      _id: id, eventId: event._id, accountId: owner, accessCodeId: null, browserMarkerDigest,
      rulesVersion: 1, votingStateVersion: 1, accessPolicy: browserMarkerDigest ? 'code' : 'account',
      categoryBallots: [{ categoryId: votingTestIds.categoryId, categoryTitle: 'Category', categoryOrder: 0,
        method: 'single', entryIds: [votingTestIds.entryId], entries: [{ entryId: votingTestIds.entryId,
          entryTitle: String(id), selectionOrder: 0 }] }], submittedAt, createdAt: submittedAt, schemaVersion: 2,
    })
    const sameTime = new Date('2030-01-01T12:00:00Z')
    await mongo.database.collection('ballotSubmissions').insertMany([
      makeBallot({ id: new ObjectId('70b000000000000000000001'), browserMarkerDigest: digest, submittedAt: sameTime }),
      makeBallot({ id: new ObjectId('70b000000000000000000002'), browserMarkerDigest: digest, submittedAt: sameTime }),
      makeBallot({ id: new ObjectId('70b000000000000000000003'), browserMarkerDigest: digest,
        submittedAt: new Date('2030-01-02T12:00:00Z') }),
      makeBallot({ id: new ObjectId('70b000000000000000000004'), accountId, submittedAt: sameTime }),
    ])
    service = createEventVotingService({ eventRepository: createEventRepository(mongo.database),
      eventEntryRepository: createEventEntryRepository(mongo.database),
      ballotRepository: createBallotSubmissionRepository(mongo.database),
      accountRepository: createAccountRepository(mongo.database), auditRepository: createAuditEventRepository(mongo.database),
      digestBrowserMarker: (value) => `digest:${value}`, withTransaction: (operation) => operation(null) })
  })
  afterAll(async () => mongo?.cleanup())

  it('pages browser history newest-first without ties, gaps, or duplicates while closed', async () => {
    const first = await service.ballotHistory({ publicId: event.publicId, first: 2 }, null,
      { browserMarker: marker, correlationId: 'history-first' })
    expect(first.nodes.map(({ id }) => id)).toEqual([
      '70b000000000000000000003', '70b000000000000000000002',
    ])
    expect(first).toMatchObject({ hasMore: true, mayCastAnother: false })
    const second = await service.ballotHistory({ publicId: event.publicId, first: 2, after: first.nextCursor }, null,
      { browserMarker: marker, correlationId: 'history-second' })
    expect(second.nodes.map(({ id }) => id)).toEqual(['70b000000000000000000001'])
    expect(second).toMatchObject({ hasMore: false, nextCursor: null })
    const latest = await service.ballotView({ publicId: event.publicId }, null, { browserMarker: marker })
    expect(latest.submittedBallot.id).toBe('70b000000000000000000003')
    expect(latest.mayCastAnother).toBe(false)
  })

  it('uses account precedence and grants hosts no ballot-choice privilege', async () => {
    const account = await service.ballotHistory({ publicId: event.publicId, first: 10 },
      { account: { _id: accountId } }, { browserMarker: marker, correlationId: 'history-account' })
    expect(account.nodes.map(({ id }) => id)).toEqual(['70b000000000000000000004'])
    const host = await service.ballotHistory({ publicId: event.publicId, first: 10 },
      { account: { _id: votingTestIds.hostId } }, { browserMarker: marker, correlationId: 'history-host' })
    expect(host.nodes).toEqual([])
    const unidentified = await service.ballotHistory({ publicId: event.publicId, first: 10 }, null,
      { correlationId: 'history-public' })
    expect(unidentified.nodes).toEqual([])
  })
})
