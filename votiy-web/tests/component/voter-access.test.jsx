import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BallotConfirmationSheet from '../../src/features/voting/BallotConfirmationSheet.jsx'

describe('ballot confirmation accessibility', () => {
  it('focuses safe cancel action and closes with Escape', async () => {
    const onCancel = vi.fn()
    render(<BallotConfirmationSheet onCancel={onCancel} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('prevents cancellation while submission is pending', async () => {
    const onCancel = vi.fn()
    render(<BallotConfirmationSheet pending onCancel={onCancel} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
  })
})
