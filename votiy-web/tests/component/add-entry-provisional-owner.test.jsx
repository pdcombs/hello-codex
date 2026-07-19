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
    await user.click(await screen.findByRole('button', { name: 'Create provisional participant' }))
    await user.type(screen.getByLabelText('Display name'), 'New Person')
    await user.click(screen.getByRole('button', { name: 'Use new participant' }))
    expect(onSelect).toHaveBeenCalledWith({ provisionalOwner: {
      displayName: 'New Person', email: 'new@example.test', phone: null,
    } })
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
