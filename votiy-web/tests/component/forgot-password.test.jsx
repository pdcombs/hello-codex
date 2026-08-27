import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from '../../src/features/auth/ForgotPasswordPage.jsx'

describe('forgot password page', () => {
  it('submits email and shows neutral success', async () => {
    const requester = vi.fn().mockResolvedValue({ accepted: true, bypassToken: null })
    render(<MemoryRouter><ForgotPasswordPage requester={requester} /></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset instructions' }))
    expect(requester).toHaveBeenCalledWith({ email: 'user@example.com' })
    expect(await screen.findByRole('status')).toHaveTextContent('If this account is eligible')
  })
  it('navigates bypass token directly to reset page', async () => {
    render(<MemoryRouter initialEntries={['/forgot-password']}><Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage requester={vi.fn().mockResolvedValue({ accepted: true, bypassToken: 'token value' })} />} />
      <Route path="/reset-password" element={<p>Reset destination</p>} />
    </Routes></MemoryRouter>)
    await userEvent.type(screen.getByLabelText('Email'), 'user@example.test')
    await userEvent.click(screen.getByRole('button', { name: 'Send reset instructions' }))
    expect(await screen.findByText('Reset destination')).toBeVisible()
  })
})
