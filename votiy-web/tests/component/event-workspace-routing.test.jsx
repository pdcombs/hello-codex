import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OwnerEventWorkspacePage from '../../src/features/events/OwnerEventWorkspacePage.jsx'
import OwnerEventPage from '../../src/features/events/OwnerEventPage.jsx'
import OwnerEventParticipantsPage from '../../src/features/events/OwnerEventParticipantsPage.jsx'
import OwnerEventResultsPage from '../../src/features/events/OwnerEventResultsPage.jsx'

const event = { id: 'evt-1', publicId: 'event', title: 'Persistent Event', description: 'Always visible',
  location: 'Main Hall', registrationPolicy: 'ADMIN_MANAGED', isOwner: true, lifecycleStatus: 'ACTIVE',
  analytics: { categoryCount: 1, participantCount: 0, entryCount: 0 }, votingState: { status: 'CLOSED', version: 1 },
  voting: { votingStatus: 'CLOSED', rules: { status: 'CONFIGURED', version: 1,
    accessPolicy: 'UNRESTRICTED', defaultCategoryRule: { method: 'SINGLE' } } },
  categories: [{ id: 'cat-1', title: 'Nominees', entries: [] }] }

function deferred() {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => { resolve = onResolve; reject = onReject })
  return { promise, resolve, reject }
}

function renderWorkspace({ initialEntries = ['/events/event'], initialIndex, participantsLoader,
  resultsLoader = vi.fn().mockResolvedValue({ event, votesReceived: 0, categories: [] }) } = {}) {
  const eventLoader = vi.fn().mockResolvedValue({ event })
  render(<MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}><Routes>
    <Route path="/events/:publicId" element={<OwnerEventWorkspacePage viewer={{ id: 'owner' }} loader={eventLoader} />}>
      <Route index element={<OwnerEventPage workspace />} />
      <Route path="participants" element={<OwnerEventParticipantsPage workspace participantsLoader={participantsLoader} />} />
      <Route path="results" element={<OwnerEventResultsPage workspace loader={resultsLoader} />} />
    </Route>
  </Routes></MemoryRouter>)
  return { eventLoader, resultsLoader }
}

describe('persistent event workspace routing', () => {
  it('keeps shared event UI mounted and confines loading below tabs', async () => {
    const pending = deferred()
    const participantsLoader = vi.fn().mockReturnValue(pending.promise)
    const { eventLoader } = renderWorkspace({ participantsLoader })
    const user = userEvent.setup()
    const heading = await screen.findByRole('heading', { name: 'Persistent Event' })

    await user.click(screen.getByRole('tab', { name: 'Participants' }))
    expect(screen.getByText('Loading participants…')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Persistent Event' })).toBe(heading)
    expect(screen.queryByText('Loading event…')).not.toBeInTheDocument()
    expect(eventLoader).toHaveBeenCalledOnce()

    pending.resolve({ registrations: [] })
    expect(await screen.findByText('No participants yet')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Results' }))
    expect(await screen.findByText('No votes received yet.')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Persistent Event' })).toBe(heading)
    expect(eventLoader).toHaveBeenCalledOnce()
  })

  it('supports direct links and history with accurate selected tabs', async () => {
    const { eventLoader } = renderWorkspace({
      initialEntries: ['/events/event', '/events/event/participants', '/events/event/results'], initialIndex: 2,
      participantsLoader: vi.fn().mockResolvedValue({ registrations: [] }),
    })
    const user = userEvent.setup()
    expect(await screen.findByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Entries' }))
    expect(screen.getByRole('tab', { name: 'Entries' })).toHaveAttribute('aria-selected', 'true')
    expect(eventLoader).toHaveBeenCalledOnce()
  })

  it('contains results failure, permits navigation, and retries on return', async () => {
    const resultsLoader = vi.fn().mockRejectedValueOnce(new Error('Results failed.'))
      .mockResolvedValue({ event, votesReceived: 0, categories: [] })
    const { eventLoader } = renderWorkspace({ initialEntries: ['/events/event/results'], resultsLoader,
      participantsLoader: vi.fn().mockResolvedValue({ registrations: [] }) })
    const user = userEvent.setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Results failed.')
    expect(screen.getByRole('heading', { name: 'Persistent Event' })).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Entries' }))
    await user.click(screen.getByRole('tab', { name: 'Results' }))
    expect(await screen.findByText('No votes received yet.')).toBeVisible()
    await waitFor(() => expect(resultsLoader).toHaveBeenCalledTimes(2))
    expect(eventLoader).toHaveBeenCalledOnce()
  })
})
