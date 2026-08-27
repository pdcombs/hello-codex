import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ResetPasswordPage from '../../src/features/auth/ResetPasswordPage.jsx'

function renderPage(props = {}) {
  return render(<MemoryRouter initialEntries={['/reset-password?token=valid-token-123456']}><Routes>
    <Route path="/reset-password" element={<ResetPasswordPage inspector={props.inspector ?? vi.fn().mockResolvedValue({
      email: 'user@example.com', expiresAt: '2030-01-01T00:15:00Z' })} resetter={props.resetter ?? vi.fn().mockResolvedValue({ reset: true })} />} />
    <Route path="/sign-in" element={<p>Sign in destination</p>} />
  </Routes></MemoryRouter>)
}
describe('reset password page', () => {
  it('shows email, rejects mismatch locally, then redirects after success', async () => {
    const resetter = vi.fn().mockResolvedValue({ reset: true }); renderPage({ resetter })
    expect(await screen.findByText('user@example.com')).toBeVisible()
    await userEvent.type(screen.getByLabelText('New password'), 'new-password-123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'different-pass-123')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(screen.getByText('Passwords must match.')).toBeVisible(); expect(resetter).not.toHaveBeenCalled()
    await userEvent.clear(screen.getByLabelText('Confirm new password')); await userEvent.type(screen.getByLabelText('Confirm new password'), 'new-password-123')
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(await screen.findByText('Sign in destination')).toBeVisible()
  })
  it('fails closed for invalid token', async () => {
    renderPage({ inspector: vi.fn().mockRejectedValue(new Error('invalid')) })
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or expired')
    expect(screen.getByRole('link', { name: 'Request another reset' })).toBeVisible()
  })
})
