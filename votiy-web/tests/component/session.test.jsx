import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../../src/features/auth/AuthProvider.jsx'
import SignInPage from '../../src/features/auth/SignInPage.jsx'

describe('session UI', () => {
  it('shows safe invalid credentials and signs in successfully', async () => {
    const signIn = vi
      .fn()
      .mockRejectedValueOnce(new Error('The email or password is incorrect.'))
      .mockResolvedValueOnce({ session: { account: { email: 'host@example.com' } } })
    render(
      <MemoryRouter>
        <AuthProvider viewerLoader={() => Promise.reject({ code: 'AUTHENTICATION_REQUIRED' })}>
          <SignInPage signIn={signIn} />
        </AuthProvider>
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'host@example.com')
    await user.type(screen.getByLabelText('Password'), 'bad')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is incorrect.')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(signIn).toHaveBeenCalledTimes(2)
  })

  it('loads viewer state and tracks expired or anonymous sessions', async () => {
    function Consumer() {
      const { viewer, loading, sessionExpired } = useAuth()
      return <p>{JSON.stringify({ viewer, loading, sessionExpired })}</p>
    }

    const { rerender } = render(
      <MemoryRouter>
        <AuthProvider viewerLoader={() => Promise.resolve({ session: { account: { email: 'host@example.com' } } })}>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText(/host@example.com/)).toBeVisible())

    rerender(
      <MemoryRouter>
        <AuthProvider viewerLoader={() => Promise.reject({ code: 'SERVICE_UNAVAILABLE' })}>
          <Consumer />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText(/"sessionExpired":false/)).toBeVisible())
  })
})
