import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventDetailsEditor from '../../src/features/events/EventDetailsEditor.jsx'

const event = { id: 'event-1', title: 'Old', description: 'Description', location: 'Place',
  updatedAt: '2030-01-01T10:00:00Z', lifecycleStatus: 'ACTIVE' }

describe('EventDetailsEditor', () => {
  it('prefills, trims, clears optional values, saves, and reloads', async () => {
    const saver = vi.fn().mockResolvedValue({ event: { ...event, title: 'New', description: null, location: null } })
    const onSaved = vi.fn()
    render(<EventDetailsEditor event={event} saver={saver} onSaved={onSaved} />)
    await userEvent.clear(screen.getByLabelText('Title')); await userEvent.type(screen.getByLabelText('Title'), ' New ')
    await userEvent.clear(screen.getByLabelText('Description')); await userEvent.clear(screen.getByLabelText('Location'))
    await userEvent.click(screen.getByRole('button', { name: 'Save event details' }))
    expect(saver).toHaveBeenCalledWith({ eventId: 'event-1', title: 'New', description: null, location: null,
      expectedUpdatedAt: event.updatedAt })
    expect(onSaved).toHaveBeenCalled()
  })

  it('validates title and makes archived event read-only', async () => {
    const { rerender } = render(<EventDetailsEditor event={event} saver={vi.fn()} onSaved={vi.fn()} />)
    await userEvent.clear(screen.getByLabelText('Title'))
    await userEvent.click(screen.getByRole('button', { name: 'Save event details' }))
    expect(screen.getByText('Title is required.')).toBeVisible()
    rerender(<EventDetailsEditor event={{ ...event, lifecycleStatus: 'ARCHIVED' }} saver={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByLabelText('Title')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save event details' })).not.toBeInTheDocument()
  })

  it('maps server field errors and gives conflict recovery guidance', async () => {
    const saver = vi.fn()
      .mockRejectedValueOnce({ code: 'VALIDATION_FAILED', message: 'Invalid',
        fieldErrors: [{ field: 'location', message: 'Location is invalid.' }] })
      .mockRejectedValueOnce({ code: 'CONFLICT', message: 'Conflict' })
    render(<EventDetailsEditor event={event} saver={saver} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save event details' }))
    expect(await screen.findByText('Location is invalid.')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Save event details' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Reload and try again')
  })
})
