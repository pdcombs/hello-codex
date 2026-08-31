import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VotingHistoryPage from '../../src/features/voting/VotingHistoryPage.jsx'

const event = { id: 'event-1', publicId: 'public-1', title: 'Awards', votingState: { status: 'OPEN' } }
function ballot(id, submittedAt, entryTitle, method = 'SINGLE') {
  return { id, submittedAt, categoryBallots: [{ categoryId: `${id}-category`, categoryTitle: 'Saved category',
    method, entries: entryTitle ? [{ entryId: `${id}-entry`, entryTitle, selectionOrder: 0 }] : [] }] }
}
function renderHistory({ loader, requester = vi.fn() }) {
  return render(<MemoryRouter initialEntries={['/events/public-1/votes']}><Routes>
    <Route path="/events/:publicId/votes" element={<VotingHistoryPage loader={loader} requester={requester} />} />
    <Route path="/events/:publicId/vote" element={<h1>Fresh ballot</h1>} />
  </Routes></MemoryRouter>)
}

describe('VotingHistoryPage', () => {
  it('renders exact semantic snapshots, timestamps, ranking, and blank categories', async () => {
    const nodes = [ballot('new', '2026-08-31T20:00:00.000Z', 'Winner', 'RANKING'),
      ballot('old', '2026-08-30T20:00:00.000Z', null)]
    renderHistory({ loader: vi.fn().mockResolvedValue({ event, nodes, nextCursor: null, hasMore: false, mayCastAnother: true }) })
    const articles = await screen.findAllByRole('article')
    expect(articles).toHaveLength(2)
    expect(articles[0]).toHaveTextContent('Winner')
    expect(within(articles[0]).getByRole('list')).toBeVisible()
    expect(articles[1]).toHaveTextContent('No selection')
    expect(within(articles[0]).getByText(/Aug/)).toHaveAttribute('datetime', '2026-08-31T20:00:00.000Z')
  })

  it('loads more, deduplicates nodes, and preserves first page on later failure', async () => {
    const loader = vi.fn().mockResolvedValueOnce({ event, nodes: [ballot('one', '2026-08-31T20:00:00Z', 'One')],
      nextCursor: 'next', hasMore: true, mayCastAnother: false })
      .mockRejectedValueOnce(new Error('History unavailable'))
      .mockResolvedValueOnce({ event, nodes: [ballot('one', '2026-08-31T20:00:00Z', 'One'),
        ballot('two', '2026-08-30T20:00:00Z', 'Two')], nextCursor: null, hasMore: false, mayCastAnother: false })
    renderHistory({ loader }); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Load more votes' }))
    expect(screen.getByRole('alert')).toHaveTextContent('History unavailable')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Retry loading votes' }))
    expect(await screen.findByText('Two')).toBeVisible()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('keeps history through invalid/cancel and starts fresh only after a new code', async () => {
    const requester = vi.fn().mockResolvedValueOnce({ allowed: false, decision: 'CODE_REQUIRED' })
      .mockResolvedValueOnce({ allowed: true, decision: 'ALLOWED' })
    renderHistory({ loader: vi.fn().mockResolvedValue({ event, nodes: [ballot('one', '2026-08-31T20:00:00Z', 'One')],
      nextCursor: null, hasMore: false, mayCastAnother: true }), requester })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Cast another vote' }))
    await user.type(screen.getByLabelText('Voting code'), 'used')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('That voting code is invalid or already used.')).toBeVisible()
    expect(screen.getByText('One')).toBeVisible()
    await user.clear(screen.getByLabelText('Voting code')); await user.type(screen.getByLabelText('Voting code'), 'fresh')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Fresh ballot' })).toBeVisible()
  })

  it('allows closed history review without another-vote action', async () => {
    renderHistory({ loader: vi.fn().mockResolvedValue({ event: { ...event, votingState: { status: 'CLOSED' } },
      nodes: [ballot('one', '2026-08-31T20:00:00Z', 'One')], nextCursor: null, hasMore: false, mayCastAnother: false }) })
    expect(await screen.findByText('Voting is closed. Previous votes remain available to review.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Cast another vote' })).not.toBeInTheDocument()
  })
})
