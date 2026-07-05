import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RegisterPage from '../../src/features/auth/RegisterPage.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function renderPage(register = vi.fn()) {
  render(
    <MemoryRouter>
      <RegisterPage register={register} />
    </MemoryRouter>,
  )
  return { register, user: userEvent.setup() }
}

async function completeForm(user, { email = 'host@example.com', password = 'a sufficiently long password' } = {}) {
  await user.type(screen.getByRole('textbox', { name: 'Email' }), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('registration page', () => {
  it('presents an accessible email and password form', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })

  it('disables duplicate submission and announces loading while registration is pending', async () => {
    const pending = deferred()
    const register = vi.fn().mockReturnValue(pending.promise)
    const { user } = renderPage(register)

    await completeForm(user)

    expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Creating your account')
    expect(register).toHaveBeenCalledOnce()
    pending.resolve({ account: { email: 'host@example.com', isVerified: false } })
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeVisible()
  })

  it('shows verification guidance after successful registration', async () => {
    const register = vi.fn().mockResolvedValue({
      account: { email: 'host@example.com', isVerified: false },
    })
    const { user } = renderPage(register)

    await completeForm(user)

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeVisible()
    expect(screen.getByText(/host@example\.com/i)).toBeVisible()
    expect(register).toHaveBeenCalledWith({
      email: 'host@example.com',
      password: 'a sufficiently long password',
      idempotencyKey: expect.any(String),
    })
  })

  it('associates server field errors with their inputs and preserves correctable values', async () => {
    const register = vi.fn().mockRejectedValue(
      new GraphqlClientError('Check the highlighted fields and try again.', {
        code: 'VALIDATION_FAILED',
        fieldErrors: [
          {
            field: 'password',
            code: 'too_small',
            message: 'Password must be at least 12 characters',
          },
        ],
      }),
    )
    const { user } = renderPage(register)

    await completeForm(user, { password: 'short' })

    expect(await screen.findByText('Password must be at least 12 characters')).toBeVisible()
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Password must be at least 12 characters')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('host@example.com')
  })

  it('offers a retry after a recoverable service failure', async () => {
    const register = vi
      .fn()
      .mockRejectedValueOnce(new GraphqlClientError('Votiy could not be reached. Please try again.'))
      .mockResolvedValueOnce({ account: { email: 'host@example.com', isVerified: false } })
    const { user } = renderPage(register)

    await completeForm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Votiy could not be reached. Please try again.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeVisible()
    expect(register).toHaveBeenCalledTimes(2)
  })
})
