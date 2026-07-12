import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OwnerEventPage from '../../src/features/events/OwnerEventPage.jsx'
import EventParticipantsPanel from '../../src/features/events/EventParticipantsPanel.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

const event = { id: 'evt-1', publicId: 'event', title: 'Event', description: null, location: null,
  registrationPolicy: 'ADMIN_MANAGED', isOwner: true,
  categories: [{ id: 'cat-1', title: 'Event participants', isDefault: true, entries: [] }] }

describe('participant secondary tab', () => {
  it('loads lazily after navigation and shows one participant with entry count', async () => {
    let resolve
    const participantsLoader = vi.fn().mockReturnValue(new Promise((done) => { resolve = done }))
    render(<MemoryRouter initialEntries={['/events/event']}><Routes><Route path="/events/:publicId" element={
      <OwnerEventPage viewer={{ id: 'owner' }} loader={() => Promise.resolve({ event })}
        participantsLoader={participantsLoader} />
    } /></Routes></MemoryRouter>)
    const user = userEvent.setup()
    expect(await screen.findByRole('tab', { name: 'Setup' })).toHaveAttribute('aria-selected', 'true')
    expect(participantsLoader).not.toHaveBeenCalled()
    await user.click(screen.getByRole('tab', { name: 'Participants' }))
    expect(screen.getByText('Loading participants…')).toBeVisible()
    resolve({ registrations: [{ id: 'reg-1', accountId: 'account-1', displayName: 'Peyton', email: null,
      phone: null, entryCount: 3, accountCompleted: true }] })
    expect(await screen.findByText('Peyton')).toBeVisible()
    expect(screen.getByText('3 entries')).toBeVisible()
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
