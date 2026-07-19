import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddEntryOwnerStep from '../../src/features/events/AddEntryOwnerStep.jsx'
import AddEntryProvisionalOwner from '../../src/features/events/AddEntryProvisionalOwner.jsx'

describe('provisional entry owner', () => {
  it('creates selection from complete unmatched email and display name', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<AddEntryOwnerStep eventId="event-1" onSelect={onSelect}
      loader={async () => ({ choices: [] })} />)
    await user.type(screen.getByLabelText('Search by email or phone'), 'new@example.test')
    await user.click(screen.getByRole('button', { name: 'Create new account' }))
    await user.type(screen.getByLabelText('Display name'), 'New Person')
    await user.click(screen.getByRole('button', { name: 'Use new participant' }))
    expect(onSelect).toHaveBeenCalledWith({ provisionalOwner: {
      displayName: 'New Person', email: 'new@example.test', phone: null,
    } })
  })

  it('always shows account creation and validates contact before continuing', async () => {
    const user = userEvent.setup()
    render(<AddEntryOwnerStep eventId="event-1" onSelect={vi.fn()}
      loader={async () => ({ choices: [] })} />)
    const button = screen.getByRole('button', { name: 'Create new account' })
    const search = screen.getByLabelText('Search by email or phone')
    expect(button).toHaveClass('primary-action')
    await user.click(button)
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a complete email address or phone number')
    expect(search).toHaveAttribute('aria-invalid', 'true')
    await user.type(search, 'invalid')
    await user.click(button)
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a complete email address or phone number')
    await user.clear(search)
    await user.type(search, 'valid@example.test')
    await user.click(button)
    expect(screen.getByText(/Create a provisional participant/)).toBeVisible()
  })

  it.each([
    ['(555) 123-4567', '+15551234567'],
    ['1-555-123-4567', '+15551234567'],
    ['+44 20 7946 0958', '+442079460958'],
    ['extension-only', 'extension-only'],
  ])('normalizes provisional phone %s', async (contact, phone) => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<AddEntryProvisionalOwner contact={contact} onSelect={onSelect} onCancel={vi.fn()} />)
    await user.type(screen.getByLabelText('Display name'), 'Phone Person')
    await user.click(screen.getByRole('button', { name: 'Use new participant' }))
    expect(onSelect).toHaveBeenCalledWith({ displayName: 'Phone Person', email: null, phone })
  })

  it('requires a display name and supports cancel', async () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<AddEntryProvisionalOwner contact="new@example.test" onSelect={onSelect} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Use new participant' }))
    expect(onSelect).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
