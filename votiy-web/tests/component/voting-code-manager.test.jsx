import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VotingCodeManager from '../../src/features/voting/VotingCodeManager.jsx'

describe('VotingCodeManager', () => {
  it('loads empty inventory, generates, refreshes, and shows claimant state', async () => {
    const loader = vi.fn().mockResolvedValueOnce({ nodes: [], nextCursor: null }).mockResolvedValueOnce({ nodes: [
      { id: '1', code: 'abc123', status: 'UNUSED' },
      { id: '2', code: 'def456', status: 'USED', claimantDisplayName: 'Peyton', claimantEmail: 'p@example.test' },
    ], nextCursor: 'next' })
    const generator = vi.fn().mockResolvedValue({ codes: [] })
    render(<VotingCodeManager eventId="event-1" loader={loader} generator={generator} />)
    expect(await screen.findByText('No voting codes generated yet.')).toBeVisible()
    await userEvent.clear(screen.getByLabelText('Number of codes')); await userEvent.type(screen.getByLabelText('Number of codes'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    expect(await screen.findByText('abc123')).toBeVisible()
    expect(screen.getByText('Peyton')).toBeVisible(); expect(screen.getByText('p@example.test')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Load more' })).toBeVisible()
    expect(generator).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'event-1', quantity: 2 }))
  })
  it('renders load failure', async () => {
    render(<VotingCodeManager eventId="event-1" loader={vi.fn().mockRejectedValue(new Error('Unavailable'))} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unavailable')
  })
})
