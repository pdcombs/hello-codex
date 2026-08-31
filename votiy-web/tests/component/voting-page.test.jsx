import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import VotingPage from '../../src/features/voting/VotingPage.jsx'

const event = { id: 'event-1', publicId: 'public-1', title: 'Awards', votingState: { status: 'OPEN', version: 2 },
  categories: [{ id: 'category-1', title: 'Finalists', entries: [{ id: 'entry-1', title: 'Alpha' }] }],
  voting: { rules: { version: 3, accessPolicy: 'CODE', defaultCategoryRule: { method: 'SINGLE' } } } }
const submittedBallot = { id: 'ballot-1', categoryBallots: [{ categoryId: 'category-1', categoryTitle: 'Finalists',
  method: 'SINGLE', entries: [{ entryId: 'entry-1', entryTitle: 'Alpha', selectionOrder: 0 }] }] }

function renderPage({ requester = vi.fn(), loader = vi.fn().mockResolvedValue({ event, submittedBallot, mayCastAnother: true }) } = {}) {
  render(<MemoryRouter initialEntries={['/events/public-1/vote']}><Routes>
    <Route path="/events/:publicId/vote" element={<VotingPage loader={loader} requester={requester} />} />
  </Routes></MemoryRouter>)
  return { requester, loader }
}

describe('VotingPage code re-entry', () => {
  it('keeps prior review during cancel and restores trigger focus', async () => {
    renderPage(); const user = userEvent.setup()
    const trigger = await screen.findByRole('button', { name: 'Cast another vote' })
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Enter a new voting code' })).toBeVisible()
    expect(screen.getByLabelText('Voting code')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(screen.getByLabelText('Alpha')).toBeChecked()
  })

  it('keeps prompt and review on invalid code', async () => {
    const requester = vi.fn().mockResolvedValue({ allowed: false, decision: 'CODE_REQUIRED' })
    renderPage({ requester }); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Cast another vote' }))
    await user.type(screen.getByLabelText('Voting code'), 'used-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(requester).toHaveBeenCalledWith({ eventId: 'event-1', accessCode: 'used-code' })
    expect(screen.getByText('That voting code is invalid or already used.')).toBeVisible()
    expect(screen.getByLabelText('Alpha')).toBeChecked()
  })

  it('shows fresh blank ballot only after new code is authorized', async () => {
    const requester = vi.fn().mockResolvedValue({ allowed: true, decision: 'ALLOWED' })
    renderPage({ requester }); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Cast another vote' }))
    await user.type(screen.getByLabelText('Voting code'), 'new-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('button', { name: 'Submit vote' })).toBeVisible()
    expect(screen.getByLabelText('Alpha')).not.toBeChecked()
    expect(screen.queryByText('Your vote was recorded')).not.toBeInTheDocument()
  })

  it('keeps review when another-vote authorization is denied for a non-code reason', async () => {
    const requester = vi.fn().mockResolvedValue({ allowed: false, decision: 'CLOSED' })
    renderPage({ requester }); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Cast another vote' }))
    await user.type(screen.getByLabelText('Voting code'), 'new-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Another vote cannot be started at this time.')).toBeVisible()
    expect(screen.getByLabelText('Alpha')).toBeChecked()
  })

  it('shows request failures without clearing the completed ballot', async () => {
    const requester = vi.fn().mockRejectedValue(new Error('Voting service unavailable.'))
    renderPage({ requester }); const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Cast another vote' }))
    await user.type(screen.getByLabelText('Voting code'), 'new-code')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Voting service unavailable.')).toBeVisible()
    expect(screen.getByLabelText('Alpha')).toBeChecked()
  })

  it('traps focus and cancels from the backdrop while idle', async () => {
    renderPage(); const user = userEvent.setup()
    const trigger = await screen.findByRole('button', { name: 'Cast another vote' })
    await user.click(trigger)
    const input = screen.getByLabelText('Voting code')
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(input).toHaveFocus()
    await user.click(document.querySelector('.dialog-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
