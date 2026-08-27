import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VotingAccessButton from '../../src/features/voting/VotingAccessButton.jsx'
import VotingComingSoonPage from '../../src/features/voting/VotingComingSoonPage.jsx'

const event = { id: 'event-1', publicId: 'public-1' }
function harness(requester) {
  return render(<MemoryRouter initialEntries={['/events/public-1']}><Routes>
    <Route path="/events/:publicId" element={<VotingAccessButton event={event} requester={requester} />} />
    <Route path="/events/:publicId/vote" element={<VotingComingSoonPage />} />
  </Routes></MemoryRouter>)
}

describe('voting access UI', () => {
  it('navigates allowed visitor to placeholder', async () => {
    harness(vi.fn().mockResolvedValue({ allowed: true, decision: 'ALLOWED' }))
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('heading', { name: 'Voting feature coming soon' })).toBeVisible()
  })
  it('opens code modal and retries invalid code', async () => {
    const requester = vi.fn().mockResolvedValueOnce({ allowed: false, decision: 'CODE_REQUIRED' })
      .mockResolvedValueOnce({ allowed: false, decision: 'CODE_REQUIRED' })
    harness(requester); const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('dialog', { name: 'Enter voting code' })).toBeVisible()
    await user.type(screen.getByLabelText('Voting code'), 'used-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByText('That voting code is invalid or already used.')).toBeVisible()
  })
  it('shows repeat-limit denial without navigation', async () => {
    harness(vi.fn().mockResolvedValue({ allowed: false, decision: 'REPEAT_LIMIT_REACHED' }))
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already reached')
  })
})
