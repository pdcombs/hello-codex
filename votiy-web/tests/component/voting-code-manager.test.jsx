import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import VotingCodeManager from '../../src/features/voting/VotingCodeManager.jsx'

describe('VotingCodeManager', () => {
  it('loads empty inventory, generates, refreshes, and shows claimant state', async () => {
    const loader = vi.fn().mockResolvedValueOnce({ nodes: [], nextCursor: null,
      summary: { usedCount: 0, availableCount: 0 } }).mockResolvedValueOnce({ nodes: [
      { id: '1', code: 'abc123', status: 'UNUSED' },
      { id: '2', code: 'def456', status: 'USED', claimantDisplayName: 'Peyton', claimantEmail: 'p@example.test' },
    ], nextCursor: 'next', summary: { usedCount: 1, availableCount: 1 } })
    const generator = vi.fn().mockResolvedValue({ codes: [] })
    render(<VotingCodeManager eventId="event-1" loader={loader} generator={generator} />)
    expect(await screen.findByText('No voting codes generated yet.')).toBeVisible()
    await userEvent.clear(screen.getByLabelText('Number of codes')); await userEvent.type(screen.getByLabelText('Number of codes'), '2')
    await userEvent.click(screen.getByRole('button', { name: 'Generate codes' }))
    expect(await screen.findByText('abc123')).toBeVisible()
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.getByLabelText('Voting code totals')).toHaveTextContent('1Used1Available')
    expect(screen.getByText('Peyton')).toBeVisible(); expect(screen.getByText('p@example.test')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Load more' })).toBeVisible()
    expect(generator).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'event-1', quantity: 2 }))
  })
  it('exports complete inventory through injected downloader', async () => {
    const codes = [{ id: '1', code: 'abc123', status: 'UNUSED' }]
    const downloader = vi.fn(); const exportLoader = vi.fn().mockResolvedValue(codes)
    render(<VotingCodeManager eventId="event-1" eventTitle="Fall Awards"
      loader={vi.fn().mockResolvedValue({ nodes: codes, nextCursor: null,
        summary: { usedCount: 0, availableCount: 1 } })}
      exportLoader={exportLoader} downloader={downloader} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Export codes CSV' }))
    expect(exportLoader).toHaveBeenCalledWith('event-1')
    expect(downloader).toHaveBeenCalledWith(codes, 'Fall Awards')
  })
  it('renders load failure', async () => {
    render(<VotingCodeManager eventId="event-1" loader={vi.fn().mockRejectedValue(new Error('Unavailable'))} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unavailable')
  })
})
