import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OwnerEventResultsPage from '../../src/features/events/OwnerEventResultsPage.jsx'

const event = { id: 'event-1', publicId: 'public-1', title: 'Awards', description: null, location: null,
  registrationPolicy: 'ADMIN_MANAGED', isOwner: true, lifecycleStatus: 'ACTIVE', categories: [],
  votingState: { status: 'CLOSED', version: 2 }, voting: { votingStatus: 'CLOSED', rules: {
    status: 'CONFIGURED', version: 1, accessPolicy: 'UNRESTRICTED', defaultCategoryRule: { method: 'SINGLE' },
  } } }

function renderPage(loader) {
  render(<MemoryRouter initialEntries={['/events/public-1/results']}><Routes>
    <Route path="/events/:publicId/results" element={<OwnerEventResultsPage loader={loader} />} />
  </Routes></MemoryRouter>)
}

describe('OwnerEventResultsPage', () => {
  it('shows ballot count, sorted category results, and co-winners', async () => {
    const loader = vi.fn().mockResolvedValue({ event, votesReceived: 3, categories: [{ categoryId: 'category-1',
      categoryTitle: 'Finalists', method: 'SINGLE', contributingBallots: 3, entries: [
        { entryId: 'a', entryTitle: 'Alpha', total: 2, winner: true },
        { entryId: 'b', entryTitle: 'Beta', total: 2, winner: true },
        { entryId: 'c', entryTitle: 'Gamma', total: 0, winner: false },
      ] }] })
    renderPage(loader)
    expect(await screen.findByLabelText('3 votes received')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Finalists' })).toBeVisible()
    expect(screen.getAllByLabelText('Winner')).toHaveLength(2)
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      expect.stringContaining('Alpha'), expect.stringContaining('Beta'), expect.stringContaining('Gamma'),
    ])
  })

  it('shows zero state and retries a failed load', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('Results unavailable.'))
      .mockResolvedValue({ event, votesReceived: 0, categories: [] })
    renderPage(loader); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No votes received yet.')).toBeVisible()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
