import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../src/features/auth/AuthProvider.jsx'
import SignOutButton from '../../src/features/auth/SignOutButton.jsx'
import * as accountOps from '../../src/features/auth/account.graphql.js'
import * as sessionOps from '../../src/features/auth/session.graphql.js'
import * as eventOps from '../../src/features/events/events.graphql.js'

vi.mock('../../src/lib/graphql.js', () => ({
  graphqlRequest: vi.fn(),
  isSchemaMismatch: vi.fn((error) => /Cannot query field|is not defined by type/.test(error.message)),
  unwrapGraphqlResult: vi.fn((value) => value),
}))

const { graphqlRequest } = await import('../../src/lib/graphql.js')

describe('checked-in GraphQL operations and auth UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps account operations with expected GraphQL metadata', async () => {
    graphqlRequest
      .mockResolvedValueOnce({ register: { account: { email: 'host@example.com' } } })
      .mockResolvedValueOnce({ verifyEmail: { session: { account: { email: 'host@example.com' } } } })
      .mockResolvedValueOnce({ resendVerification: { account: { email: 'host@example.com' } } })
      .mockResolvedValueOnce({ viewer: { session: { account: { email: 'host@example.com' } } } })

    await expect(accountOps.registerAccount({ email: 'host@example.com', password: 'pw', idempotencyKey: '1' })).resolves.toEqual({
      account: { email: 'host@example.com' },
    })
    await accountOps.verifyAccountEmail({ token: 'token' })
    await accountOps.resendAccountVerification()
    await accountOps.loadViewer()

    expect(graphqlRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ operationName: 'Register', variables: { input: expect.any(Object) } }),
    )
    expect(graphqlRequest).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ operationName: 'Viewer' }),
    )
  })

  it('wraps session and event operations with expected GraphQL metadata', async () => {
    graphqlRequest
      .mockResolvedValueOnce({ signIn: { session: { account: { email: 'host@example.com' } } } })
      .mockResolvedValueOnce({ signOut: { signedOut: true } })
      .mockResolvedValueOnce({ ownedEvents: { events: { nodes: [] } } })
      .mockResolvedValueOnce({ eventByPublicId: { event: { publicId: 'public-id' } } })
      .mockResolvedValueOnce({ eventRegistrations: { registrations: [] } })
      .mockResolvedValueOnce({ createEvent: { event: { publicId: 'public-id' } } })
      .mockResolvedValueOnce({ setEventRegistrationPolicy: { event: { registrationPolicy: 'OPEN' } } })
      .mockResolvedValueOnce({ registerForEvent: { registration: { id: 'reg-1' } } })
      .mockResolvedValueOnce({ addEventParticipant: { registration: { id: 'reg-2' } } })
      .mockResolvedValueOnce({ removeEventParticipant: { registration: { id: 'reg-3' } } })
      .mockResolvedValueOnce({ addEventCategory: { event: { id: 'evt-1' } } })
      .mockResolvedValueOnce({ renameEventCategory: { event: { id: 'evt-1' } } })

    await sessionOps.signInAccount({ email: 'host@example.com', password: 'pw' })
    await sessionOps.signOutAccount()
    await eventOps.loadOwnedEvents()
    await eventOps.loadEventByPublicId('public-id')
    await eventOps.loadEventRegistrations('evt-1')
    await eventOps.createEvent({ title: 'Board vote' })
    await eventOps.setEventRegistrationPolicy({ eventId: 'evt-1', registrationPolicy: 'OPEN' })
    await eventOps.registerForEvent({ eventId: 'evt-1', idempotencyKey: 'abc' })
    await eventOps.addEventParticipant({ eventId: 'evt-1', email: 'guest@example.com', idempotencyKey: 'def' })
    await eventOps.removeEventParticipant({ eventId: 'evt-1', registrationId: 'reg-2' })
    await eventOps.addEventCategory({ eventId: 'evt-1', title: 'Desserts', idempotencyKey: 'ghi' })
    await eventOps.renameEventCategory({ eventId: 'evt-1', categoryId: 'cat-1', title: 'People', idempotencyKey: 'jkl' })

    expect(graphqlRequest).toHaveBeenNthCalledWith(1, expect.objectContaining({ operationName: 'SignIn' }))
    expect(graphqlRequest).toHaveBeenNthCalledWith(6, expect.objectContaining({ operationName: 'CreateEvent' }))
    expect(graphqlRequest).toHaveBeenNthCalledWith(10, expect.objectContaining({ operationName: 'RemoveEventParticipant' }))
    expect(graphqlRequest).toHaveBeenNthCalledWith(12, expect.objectContaining({ operationName: 'RenameEventCategory' }))
    expect(eventOps.EVENT_REGISTRATIONS).toContain('entryCount')
  })

  it('retries event reads with legacy fields during rolling API upgrades', async () => {
    graphqlRequest
      .mockRejectedValueOnce(new Error('Cannot query field "categories" on type "Event".'))
      .mockResolvedValueOnce({ ownedEvents: { events: { nodes: [{ id: 'legacy-event' }] } } })

    await expect(eventOps.loadOwnedEvents()).resolves.toEqual({ events: { nodes: [{ id: 'legacy-event' }] } })
    expect(graphqlRequest).toHaveBeenCalledTimes(2)
    expect(graphqlRequest.mock.calls[1][0].query).not.toContain('categories')
  })

  it('retries all legacy schema compatibility paths', async () => {
    graphqlRequest
      .mockRejectedValueOnce(new Error('Field "displayName" is not defined by type "RegisterInput".'))
      .mockResolvedValueOnce({ register: { account: { email: 'legacy@example.com' } } })
      .mockRejectedValueOnce(new Error('Cannot query field "categories" on type "Event".'))
      .mockResolvedValueOnce({ eventByPublicId: { event: { id: 'legacy-event' } } })
      .mockRejectedValueOnce(new Error('Cannot query field "entryCount" on type "EventRegistration".'))
      .mockResolvedValueOnce({ eventRegistrations: { registrations: [] } })
      .mockResolvedValueOnce({ registerForEvent: { registration: { id: 'legacy-registration' } } })

    await accountOps.registerAccount({ displayName: 'Legacy', email: 'legacy@example.com', password: 'password', idempotencyKey: '1' })
    await eventOps.loadEventByPublicId('legacy-event')
    await eventOps.loadEventRegistrations('legacy-event')
    await eventOps.registerForEvent({ eventId: 'legacy-event', idempotencyKey: '2' }, { legacy: true })

    expect(graphqlRequest.mock.calls[1][0].variables.input).not.toHaveProperty('displayName')
    expect(graphqlRequest.mock.calls[3][0].query).not.toContain('categories')
    expect(graphqlRequest.mock.calls[5][0].query).not.toContain('entryCount')
    expect(graphqlRequest.mock.calls[6][0].variables).toEqual({ eventId: 'legacy-event', idempotencyKey: '2' })
  })

  it('normalizes missing category entry arrays and preserves legacy events', () => {
    expect(eventOps.normalizeEventSetup({ event: { categories: [{ id: 'cat-1' }] } }).event.categories[0].entries).toEqual([])
    const legacy = { event: { id: 'legacy' } }
    expect(eventOps.normalizeEventSetup(legacy)).toBe(legacy)
  })

  it('renders sign-out button and calls sign-out action', async () => {
    const signOut = vi.fn().mockResolvedValue({ signedOut: true })
    render(
      <MemoryRouter>
        <AuthProvider initialViewer={{ email: 'host@example.com' }}>
          <SignOutButton signOut={signOut} />
        </AuthProvider>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(signOut).toHaveBeenCalledOnce()
  })
})
