import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../../src/features/auth/AuthProvider.jsx'
import VerifyEmailPage from '../../src/features/auth/VerifyEmailPage.jsx'
import EventDashboardPage from '../../src/features/events/EventDashboardPage.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

function ViewerProbe() {
  const { viewer } = useAuth()
  return <p>{viewer?.email ?? 'anonymous'}</p>
}

function deferred() {
  let resolve
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function renderVerification({
  token = 'verification-token',
  verifyEmail = vi.fn(),
  resendVerification = vi.fn(),
  onVerified = vi.fn(),
} = {}) {
  render(
    <MemoryRouter>
      <VerifyEmailPage
        token={token}
        verifyEmail={verifyEmail}
        resendVerification={resendVerification}
        onVerified={onVerified}
      />
    </MemoryRouter>,
  )
  return { verifyEmail, resendVerification, onVerified, user: userEvent.setup() }
}

describe('verification page', () => {
  it('announces progress while consuming the link', () => {
    const pending = deferred()
    const verifyEmail = vi.fn().mockReturnValue(pending.promise)

    renderVerification({ verifyEmail })

    expect(screen.getByRole('status')).toHaveTextContent('Verifying your email…')
    expect(verifyEmail).toHaveBeenCalledWith({ token: 'verification-token' })
  })

  it('establishes viewer state and confirms successful verification', async () => {
    const account = { id: 'account-1', email: 'host@example.com', isVerified: true }
    const verifyEmail = vi.fn().mockResolvedValue({ session: { account } })
    const onVerified = vi.fn()

    renderVerification({ verifyEmail, onVerified })

    expect(await screen.findByRole('heading', { name: 'Email verified' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'View your events' })).toHaveAttribute('href', '/')
    expect(onVerified).toHaveBeenCalledWith(account)
  })

  it.each(['expired', 'already used', 'superseded'])('shows the same safe recovery for an %s link', async () => {
    const verifyEmail = vi.fn().mockRejectedValue(
      new GraphqlClientError('This verification link is invalid or has expired.', {
        code: 'INVALID_OR_EXPIRED_TOKEN',
      }),
    )

    renderVerification({ verifyEmail })

    expect(await screen.findByRole('alert')).toHaveTextContent('This verification link is invalid or has expired.')
    expect(screen.getByRole('button', { name: 'Send a new verification email' })).toBeVisible()
  })

  it('supports resending after an invalid link and confirms delivery without exposing a token', async () => {
    const verifyEmail = vi.fn().mockRejectedValue(
      new GraphqlClientError('This verification link is invalid or has expired.', {
        code: 'INVALID_OR_EXPIRED_TOKEN',
      }),
    )
    const resendVerification = vi.fn().mockResolvedValue({
      account: { email: 'host@example.com', isVerified: false },
    })
    const { user } = renderVerification({ verifyEmail, resendVerification })

    await user.click(await screen.findByRole('button', { name: 'Send a new verification email' }))

    expect(await screen.findByRole('status')).toHaveTextContent('A new verification email is on its way.')
    expect(resendVerification).toHaveBeenCalledOnce()
    expect(document.body).not.toHaveTextContent('verification-token')
  })

  it('shows a recoverable failure when verification cannot reach the service', async () => {
    const verifyEmail = vi
      .fn()
      .mockRejectedValue(new GraphqlClientError('Votiy could not be reached. Please try again.'))

    renderVerification({ verifyEmail })

    expect(await screen.findByRole('alert')).toHaveTextContent('Votiy could not be reached. Please try again.')
    expect(screen.getByRole('button', { name: 'Try verification again' })).toBeVisible()
  })
})

describe('authenticated empty dashboard', () => {
  it('uses an already-known viewer without requesting it again', () => {
    const viewerLoader = vi.fn()
    render(
      <AuthProvider initialViewer={{ email: 'known@example.com' }} viewerLoader={viewerLoader}>
        <ViewerProbe />
      </AuthProvider>,
    )
    expect(screen.getByText('known@example.com')).toBeVisible()
    expect(viewerLoader).not.toHaveBeenCalled()
  })

  it('explains the empty state and offers event creation', () => {
    render(
      <MemoryRouter>
        <EventDashboardPage viewer={{ email: 'host@example.com' }} events={[]} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
    expect(screen.getByText('You have not created any voting events yet.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create your first event' })).toHaveAttribute('href', '/events/new')
  })

  it('lists hosted events as links to their detail pages', () => {
    render(
      <MemoryRouter>
        <EventDashboardPage
          viewer={{ email: 'host@example.com' }}
          events={[{ id: 'event-1', publicId: 'public-event-1', title: 'Team awards' }]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Team awards' })).toHaveAttribute('href', '/events/public-event-1')
    expect(screen.queryByText('You have not created any voting events yet.')).not.toBeInTheDocument()
  })
})
