import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VotingStatusControl from '../../src/features/voting/VotingStatusControl.jsx'
import EventWorkspaceSummary from '../../src/features/events/EventWorkspaceSummary.jsx'
import EventVotingSummary from '../../src/features/events/EventVotingSummary.jsx'

const event = { id: 'event-1', publicId: 'public-1', title: 'Awards', isOwner: true,
  votingState: { status: 'CLOSED', version: 1 }, analytics: {}, voting: { rules: { accessPolicy: 'UNRESTRICTED',
    opensAt: '2030-01-01T00:00:00Z', closesAt: '2030-01-02T00:00:00Z',
    defaultCategoryRule: { method: 'SINGLE' } } } }

describe('open close voting UI', () => {
  it('changes host action and warns about empty code inventory', async () => {
    const saver = vi.fn().mockResolvedValue({ event: { ...event, votingState: { status: 'OPEN', version: 2 } }, hasUnusedCodes: false })
    render(<MemoryRouter><VotingStatusControl event={event} saver={saver} /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: 'Open Voting' }))
    expect(saver).toHaveBeenCalledWith({ eventId: 'event-1', status: 'OPEN', expectedVersion: 1 })
    expect(await screen.findByText(/No unused voting codes remain/)).toBeVisible()
  })
  it('shows banner and Vote to host while open', () => {
    render(<MemoryRouter><EventWorkspaceSummary event={{ ...event, votingState: { status: 'OPEN', version: 2 } }} /></MemoryRouter>)
    expect(screen.getByText('Voting is now open')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Vote' })).toBeVisible()
  })
  it('states closed in voting summary', () => {
    render(<EventVotingSummary event={event} />)
    expect(screen.getByText('Voting is closed at this time.')).toBeVisible()
  })
})
