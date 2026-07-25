import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EventParticipantsPanel from '../../src/features/events/EventParticipantsPanel.jsx'

describe('entry-derived participants', () => {
  it('keeps cards and removal but removes direct participant creation', async () => {
    render(<MemoryRouter><EventParticipantsPanel eventId="event-1"
      loader={() => Promise.resolve({ participants: [{
        accountId: 'account-1', displayName: 'Peyton', email: 'peyton@example.test',
        entries: [{ id: 'entry-1', title: 'Pie' }], entryCount: 1,
      }] })} removeParticipant={vi.fn()} /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Peyton' })).toBeVisible()
    expect(screen.getByText('Pie')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Remove participant' })).toBeVisible()
    expect(screen.queryByText('Add a participant')).not.toBeInTheDocument()
  })
})
