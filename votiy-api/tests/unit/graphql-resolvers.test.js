import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationError, ErrorCode } from '../../src/domain/errors.js'
import { createAccountResolvers } from '../../src/api/graphql/account-resolvers.js'
import { createSessionResolvers } from '../../src/api/graphql/session-resolvers.js'
import { createEventResolvers } from '../../src/api/graphql/event-resolvers.js'

const account = {
  _id: new ObjectId(),
  emailNormalized: 'host@example.com',
  verificationStatus: 'verified',
  createdAt: new Date('2026-07-09T00:00:00.000Z'),
}

describe('GraphQL resolvers', () => {
  it('resolves account flows and safe failures', async () => {
    const registrationService = { register: vi.fn().mockResolvedValue({ account, verificationToken: 'token' }) }
    const verificationService = {
      verifyEmail: vi.fn().mockResolvedValue({ account, sessionSecret: 'secret' }),
      resendVerification: vi.fn().mockResolvedValue({ account, verificationToken: 'token-2' }),
    }
    const sessionService = {
      viewer: vi.fn().mockResolvedValue({ account }),
    }
    const auditRepository = { append: vi.fn().mockResolvedValue(undefined) }
    const resolvers = createAccountResolvers({ registrationService, verificationService, sessionService, auditRepository })
    const context = {
      correlationId: 'cid',
      session: { secret: 'cookie' },
      setSessionCookie: vi.fn(),
    }

    await expect(resolvers.register({ input: { email: 'host@example.com' } }, context)).resolves.toMatchObject({
      __typename: 'AccountSuccess',
      verificationToken: 'token',
    })
    await expect(resolvers.verifyEmail({ input: { token: 'token' } }, context)).resolves.toMatchObject({
      __typename: 'SessionSuccess',
    })
    await expect(resolvers.resendVerification({}, context)).resolves.toMatchObject({
      __typename: 'AccountSuccess',
      verificationToken: 'token-2',
    })
    await expect(resolvers.viewer({}, context)).resolves.toMatchObject({
      __typename: 'SessionSuccess',
    })
    expect(context.setSessionCookie).toHaveBeenCalledWith('secret')

    const failingResolvers = createAccountResolvers({
      registrationService: { register: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.CONFLICT)) },
      verificationService,
      sessionService: { viewer: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)) },
      auditRepository,
    })
    await expect(failingResolvers.register({ input: {} }, context)).resolves.toMatchObject({
      __typename: 'OperationError',
      code: 'CONFLICT',
    })
    await expect(failingResolvers.viewer({}, context)).resolves.toMatchObject({
      __typename: 'OperationError',
      code: 'AUTHENTICATION_REQUIRED',
    })
  })

  it('resolves session flows and safe failures', async () => {
    const authenticationService = {
      signIn: vi.fn().mockResolvedValue({ account, sessionSecret: 'secret' }),
      signOut: vi.fn().mockResolvedValue({ signedOut: true }),
    }
    const auditRepository = { append: vi.fn().mockResolvedValue(undefined) }
    const resolvers = createSessionResolvers({ authenticationService, auditRepository })
    const context = {
      correlationId: 'cid',
      session: { secret: 'cookie' },
      setSessionCookie: vi.fn(),
      clearSessionCookie: vi.fn(),
    }

    await expect(resolvers.signIn({ input: { email: 'host@example.com' } }, context)).resolves.toMatchObject({
      __typename: 'SessionSuccess',
    })
    await expect(resolvers.signOut({}, context)).resolves.toMatchObject({
      __typename: 'SignOutSuccess',
      signedOut: true,
    })
    expect(context.setSessionCookie).toHaveBeenCalledWith('secret')
    expect(context.clearSessionCookie).toHaveBeenCalledOnce()

    const failingResolvers = createSessionResolvers({
      authenticationService: {
        signIn: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.INVALID_CREDENTIALS)),
        signOut: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)),
      },
      auditRepository,
    })
    await expect(failingResolvers.signIn({ input: {} }, context)).resolves.toMatchObject({
      __typename: 'OperationError',
      code: 'INVALID_CREDENTIALS',
    })
    await expect(failingResolvers.signOut({}, context)).resolves.toMatchObject({
      __typename: 'OperationError',
      code: 'SERVICE_UNAVAILABLE',
    })
  })

  it('resolves event flows and safe failures', async () => {
    const eventService = {
      ownedEvents: vi.fn().mockResolvedValue({ events: { nodes: [] } }),
      eventByPublicId: vi.fn().mockResolvedValue({ event: { id: 'evt-1', registrationPolicy: 'OPEN' } }),
      createEvent: vi.fn().mockResolvedValue({ event: { id: 'evt-1', registrationPolicy: 'OPEN' } }),
      setRegistrationPolicy: vi.fn().mockResolvedValue({ event: { id: 'evt-1', registrationPolicy: 'ADMIN_MANAGED' } }),
    }
    const eventRegistrationService = {
      listRegistrations: vi.fn().mockResolvedValue({ registrations: [] }),
      registerForEvent: vi.fn().mockResolvedValue({ registration: { id: 'reg-1', source: 'SELF' } }),
      addParticipant: vi.fn().mockResolvedValue({ registration: { id: 'reg-2', source: 'HOST' }, provisionalCreated: true }),
      removeParticipant: vi.fn().mockResolvedValue({ registration: { id: 'reg-3', source: 'HOST' } }),
    }
    const auditRepository = { append: vi.fn().mockResolvedValue(undefined) }
    const resolvers = createEventResolvers({ eventService, eventRegistrationService, auditRepository })
    const context = { correlationId: 'cid', viewer: { account } }

    await expect(resolvers.ownedEvents({ first: 20, after: null }, context)).resolves.toMatchObject({ __typename: 'EventListSuccess' })
    await expect(resolvers.eventByPublicId({ publicId: 'public-id' }, context)).resolves.toMatchObject({ __typename: 'EventSuccess' })
    await expect(resolvers.eventRegistrations({ eventId: 'evt-1' }, context)).resolves.toMatchObject({ __typename: 'EventRegistrationListSuccess' })
    await expect(resolvers.createEvent({ input: { title: 'Board vote' } }, context)).resolves.toMatchObject({ __typename: 'EventSuccess' })
    await expect(resolvers.setEventRegistrationPolicy({ input: { eventId: 'evt-1', registrationPolicy: 'OPEN' } }, context)).resolves.toMatchObject({ __typename: 'EventSuccess' })
    await expect(resolvers.registerForEvent({ eventId: 'evt-1', idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }, context)).resolves.toMatchObject({ __typename: 'EventRegistrationSuccess' })
    await expect(resolvers.addEventParticipant({ input: { eventId: 'evt-1', email: 'guest@example.com' } }, context)).resolves.toMatchObject({ __typename: 'EventRegistrationSuccess' })
    await expect(resolvers.removeEventParticipant({ input: { eventId: 'evt-1', registrationId: 'reg-3' } }, context)).resolves.toMatchObject({ __typename: 'EventRegistrationSuccess' })
    expect(auditRepository.append).toHaveBeenCalled()

    const failingResolvers = createEventResolvers({
      eventService: {
        ownedEvents: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)),
        eventByPublicId: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.NOT_FOUND)),
        createEvent: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.SERVICE_UNAVAILABLE)),
        setRegistrationPolicy: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.FORBIDDEN)),
      },
      eventRegistrationService: {
        listRegistrations: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.FORBIDDEN)),
        registerForEvent: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.FORBIDDEN)),
        addParticipant: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.VALIDATION_FAILED)),
        removeParticipant: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.CONFLICT)),
      },
      auditRepository,
    })
    await expect(failingResolvers.ownedEvents({ first: 20, after: null }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'AUTHENTICATION_REQUIRED' })
    await expect(failingResolvers.eventByPublicId({ publicId: 'missing' }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'NOT_FOUND' })
    await expect(failingResolvers.eventRegistrations({ eventId: 'evt-1' }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'FORBIDDEN' })
    await expect(failingResolvers.createEvent({ input: {} }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'SERVICE_UNAVAILABLE' })
    await expect(failingResolvers.setEventRegistrationPolicy({ input: {} }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'FORBIDDEN' })
    await expect(failingResolvers.registerForEvent({ eventId: 'evt-1', idempotencyKey: '123e4567-e89b-42d3-a456-426614174000' }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'FORBIDDEN' })
    await expect(failingResolvers.addEventParticipant({ input: {} }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'VALIDATION_FAILED' })
    await expect(failingResolvers.removeEventParticipant({ input: {} }, context)).resolves.toMatchObject({ __typename: 'OperationError', code: 'CONFLICT' })
  })

  it('resolves entry-derived participant creation, reads, and archive results', async () => {
    const result = { createdEntries: [{ id: 'entry-1', createdAt: new Date() }], affectedParticipant: {
      accountId: 'account-1', displayName: 'Peyton', email: 'peyton@example.test', entryCount: 1,
      entries: [{ id: 'entry-1', createdAt: new Date() }],
    } }
    const archive = { archivedEntryIds: ['entry-1'], affectedParticipant: null }
    const eventEntryService = {
      listParticipants: vi.fn().mockResolvedValue({ participants: [result.affectedParticipant] }),
      registerForEvent: vi.fn().mockResolvedValue(result),
      addParticipant: vi.fn().mockResolvedValue(result),
      archiveEntry: vi.fn().mockResolvedValue(archive),
      archiveParticipantEntries: vi.fn().mockResolvedValue(archive),
    }
    const auditRepository = { append: vi.fn().mockResolvedValue(undefined) }
    const resolvers = createEventResolvers({ eventService: {}, eventRegistrationService: {},
      eventEntryService, auditRepository })
    const context = { correlationId: 'cid', viewer: { account } }
    await expect(resolvers.eventParticipants({ eventId: 'evt-1' }, context))
      .resolves.toMatchObject({ __typename: 'ParticipantListSuccess' })
    await expect(resolvers.eventRegistrations({ eventId: 'evt-1' }, context))
      .resolves.toMatchObject({ __typename: 'EventRegistrationListSuccess' })
    await expect(resolvers.registerForEvent({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EventRegistrationSuccess' })
    await expect(resolvers.addEventParticipant({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EventRegistrationSuccess' })
    await expect(resolvers.createSelfEventEntries({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EntryCreationSuccess' })
    await expect(resolvers.createEventEntriesForParticipant({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EntryCreationSuccess' })
    await expect(resolvers.archiveEventEntry({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EntryArchiveSuccess' })
    await expect(resolvers.archiveEventParticipantEntries({ input: { eventId: 'evt-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EntryArchiveSuccess' })
    await expect(resolvers.removeEventParticipant({ input: { eventId: 'evt-1', registrationId: 'account-1' } }, context))
      .resolves.toMatchObject({ __typename: 'EventRegistrationSuccess', registration: { status: 'REMOVED' } })

    for (const method of Object.keys(eventEntryService)) {
      eventEntryService[method].mockRejectedValue(new ApplicationError(ErrorCode.FORBIDDEN))
    }
    await expect(resolvers.eventParticipants({ eventId: 'evt-1' }, context)).resolves.toMatchObject({ code: 'FORBIDDEN' })
    await expect(resolvers.createSelfEventEntries({ input: { eventId: 'evt-1' } }, context)).resolves.toMatchObject({ code: 'FORBIDDEN' })
    await expect(resolvers.createEventEntriesForParticipant({ input: { eventId: 'evt-1' } }, context)).resolves.toMatchObject({ code: 'FORBIDDEN' })
    await expect(resolvers.archiveEventEntry({ input: { eventId: 'evt-1' } }, context)).resolves.toMatchObject({ code: 'FORBIDDEN' })
    await expect(resolvers.archiveEventParticipantEntries({ input: { eventId: 'evt-1' } }, context)).resolves.toMatchObject({ code: 'FORBIDDEN' })
  })
})
