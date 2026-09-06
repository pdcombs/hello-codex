import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VotingAccessButton, { VotingOpenBanner } from '../../src/features/voting/VotingAccessButton.jsx'
import useVotingAccessController from '../../src/features/voting/useVotingAccessController.js'
import VotingComingSoonPage from '../../src/features/voting/VotingComingSoonPage.jsx'

function HistoryPlaceholder() { return <h1>Previous votes</h1> }
function AccessHarness({ requester, showBanner }) {
  const controller = useVotingAccessController(event, requester)
  return <>{showBanner && <VotingOpenBanner controller={controller} />}
    <VotingAccessButton event={event} requester={requester} controller={controller} /></>
}

const event = { id: 'event-1', publicId: 'public-1' }
function harness(requester, showBanner = false) {
  return render(<MemoryRouter initialEntries={['/events/public-1']}><Routes>
    <Route path="/events/:publicId" element={<AccessHarness requester={requester} showBanner={showBanner} />} />
    <Route path="/events/:publicId/vote" element={<VotingComingSoonPage />} />
    <Route path="/events/:publicId/votes" element={<HistoryPlaceholder />} />
  </Routes></MemoryRouter>)
}

describe('voting access UI', () => {
  it('navigates allowed visitor to placeholder', async () => {
    harness(vi.fn().mockResolvedValue({ allowed: true, decision: 'ALLOWED' }))
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('heading', { name: 'Voting feature coming soon' })).toBeVisible()
  })
  it('runs banner through same code-required flow and keeps Vote button', async () => {
    const requester = vi.fn().mockResolvedValue({ allowed: false, decision: 'CODE_REQUIRED' })
    harness(requester, true)
    expect(screen.getByRole('button', { name: 'Vote' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Voting is now open. Click here to vote' }))
    expect(await screen.findByRole('dialog', { name: 'Enter voting code' })).toBeVisible()
    expect(requester).toHaveBeenCalledOnce()
  })
  it('blocks duplicate banner requests while access check is pending', async () => {
    let resolve; const requester = vi.fn(() => new Promise((done) => { resolve = done }))
    harness(requester, true); const banner = screen.getByRole('button', { name: 'Voting is now open. Click here to vote' })
    fireEvent.click(banner); fireEvent.click(banner)
    expect(requester).toHaveBeenCalledOnce(); expect(banner).toBeDisabled()
    resolve({ allowed: false, decision: 'REPEAT_LIMIT_REACHED' })
    expect(await screen.findByRole('alert')).toBeVisible()
  })
  it('opens code modal and retries invalid code', async () => {
    const requester = vi.fn().mockResolvedValueOnce({ allowed: false, decision: 'CODE_REQUIRED' })
      .mockResolvedValueOnce({ allowed: false, decision: 'CODE_REQUIRED' })
    harness(requester); const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('dialog', { name: 'Enter voting code' })).toBeVisible()
    const codeInput = screen.getByLabelText('Voting code')
    expect(codeInput).toHaveAttribute('autocapitalize', 'none')
    expect(codeInput).toHaveAttribute('autocorrect', 'off')
    expect(codeInput).toHaveAttribute('spellcheck', 'false')
    await user.type(codeInput, 'USED-CODE')
    expect(codeInput).toHaveValue('used-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(requester).toHaveBeenLastCalledWith({ eventId: 'event-1', accessCode: 'used-code' })
    expect(await screen.findByText('That voting code is invalid or already used.')).toBeVisible()
  })
  it('shows repeat-limit denial without navigation', async () => {
    harness(vi.fn().mockResolvedValue({ allowed: false, decision: 'REPEAT_LIMIT_REACHED' }))
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already reached')
  })
  it('opens previous votes without submitting a code when identity has history', async () => {
    const requester = vi.fn().mockResolvedValue({ allowed: false, decision: 'CODE_REQUIRED', hasBallotHistory: true })
    harness(requester); const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Vote' }))
    await user.click(await screen.findByRole('button', { name: 'View previous votes' }))
    expect(await screen.findByRole('heading', { name: 'Previous votes' })).toBeVisible()
    expect(requester).toHaveBeenCalledOnce()
  })
  it('hides previous votes when server reports no history', async () => {
    harness(vi.fn().mockResolvedValue({ allowed: false, decision: 'CODE_REQUIRED', hasBallotHistory: false }))
    await userEvent.click(screen.getByRole('button', { name: 'Vote' }))
    expect(await screen.findByRole('dialog')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'View previous votes' })).not.toBeInTheDocument()
  })
})
