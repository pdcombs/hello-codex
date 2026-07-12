import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OwnerEventPage from '../../src/features/events/OwnerEventPage.jsx'
import OwnerEventParticipantsPage from '../../src/features/events/OwnerEventParticipantsPage.jsx'
import EventParticipantsPanel from '../../src/features/events/EventParticipantsPanel.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

const event = { id: 'evt-1', publicId: 'event', title: 'Event', description: null, location: null,
  registrationPolicy: 'ADMIN_MANAGED', isOwner: true,
  categories: [{ id: 'cat-1', title: 'Event participants', isDefault: true, entries: [] }] }

describe('participant secondary page', () => {
  it('loads after page navigation and links back to event details', async () => {
    let resolve
    const participantsLoader = vi.fn().mockReturnValue(new Promise((done) => { resolve = done }))
    const eventLoader = () => Promise.resolve({ event })
    render(<MemoryRouter initialEntries={['/events/event']}><Routes>
      <Route path="/events/:publicId" element={<OwnerEventPage viewer={{ id: 'owner' }} loader={eventLoader} />} />
      <Route path="/events/:publicId/participants" element={<OwnerEventParticipantsPage loader={eventLoader}
        participantsLoader={participantsLoader} />} />
    </Routes></MemoryRouter>)
    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Event' })).toBeVisible()
    expect(participantsLoader).not.toHaveBeenCalled()
    await user.click(screen.getByRole('link', { name: 'View all participants' }))
    expect(screen.getByText('Loading participants…')).toBeVisible()
    resolve({ registrations: [{ id: 'reg-1', accountId: 'account-1', displayName: 'Peyton', email: null,
      phone: null, entryCount: 3, accountCompleted: true }] })
    expect(await screen.findByText('Peyton')).toBeVisible()
    expect(screen.getByLabelText('3 entries')).toHaveTextContent('3')
    expect(screen.getByRole('link', { name: 'Back to event' })).toHaveAttribute('href', '/events/event')
  })

  it('shows empty and error states', async () => {
    const { unmount } = render(<MemoryRouter><EventParticipantsPanel eventId="evt-1" categories={event.categories}
      loader={() => Promise.resolve({ registrations: [] })} /></MemoryRouter>)
    expect(await screen.findByText('No participants registered yet.')).toBeVisible()
    unmount()
    render(<MemoryRouter><EventParticipantsPanel eventId="evt-1" categories={event.categories}
      loader={() => Promise.reject(new GraphqlClientError('Participants failed.'))} /></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Participants failed.')
  })
})
