import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GraphqlClientError } from '../../src/lib/graphql.js'
import CreateEventPage from '../../src/features/events/CreateEventPage.jsx'
import EventDashboardPage from '../../src/features/events/EventDashboardPage.jsx'
import EventPage from '../../src/features/events/EventPage.jsx'
import EventParticipantsPanel from '../../src/features/events/EventParticipantsPanel.jsx'
import OwnerEventPage from '../../src/features/events/OwnerEventPage.jsx'
import OwnerEventParticipantsPage from '../../src/features/events/OwnerEventParticipantsPage.jsx'

describe('event UI', () => {
  it('loads the hosted dashboard and links to saved events', async () => {
    const loader = vi.fn().mockResolvedValue({
      events: {
        nodes: [
          { id: 'evt-1', publicId: 'event-one', title: 'Board vote', registrationPolicy: 'ADMIN_MANAGED' },
          { id: 'evt-2', publicId: 'event-two', title: 'Budget vote', registrationPolicy: 'OPEN' },
        ],
      },
    })

    render(
      <MemoryRouter>
        <EventDashboardPage viewer={{ email: 'host@example.com' }} loader={loader} />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: 'Board vote' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Budget vote' })).toBeVisible()
    expect(loader).toHaveBeenCalledWith({ first: 20 })
  })

  it('creates an event and redirects to its detail page', async () => {
    const create = vi.fn().mockResolvedValue({
      event: { id: 'evt-1', publicId: 'board-vote', title: 'Board vote' },
    })
    render(
      <MemoryRouter initialEntries={['/events/new']}>
        <Routes>
          <Route path="/events/new" element={<CreateEventPage create={create} />} />
          <Route path="/events/:publicId" element={<p>Arrived</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Title'), 'Board vote')
    await user.selectOptions(screen.getByLabelText('Registration policy'), 'OPEN')
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByText('Arrived')).toBeVisible()
    expect(create).toHaveBeenCalledWith({
      title: 'Board vote',
      description: null,
      location: null,
      registrationPolicy: 'OPEN',
      idempotencyKey: expect.any(String),
    })
  })

  it('renders public event details and allows self-registration for open events', async () => {
    const loader = vi.fn().mockResolvedValue({
      event: {
        id: 'evt-1',
        publicId: 'board-vote',
        title: 'Board vote',
        description: 'Choose next quarter priorities',
        location: 'Remote',
        registrationPolicy: 'OPEN',
        isOwner: false,
      },
    })
    const register = vi.fn().mockResolvedValue({ registration: { id: 'reg-1' } })
    render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route path="/events/:publicId" element={<EventPage viewer={{ id: 'acct-1' }} loader={loader} register={register} />} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByRole('heading', { name: 'Board vote' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Register for event' }))
    expect(await screen.findByText('You are registered for this event.')).toBeVisible()
  })

  it('shows sign-in guidance or registration errors for open events', async () => {
    const baseEvent = {
      id: 'evt-1',
      publicId: 'board-vote',
      title: 'Board vote',
      description: null,
      location: null,
      registrationPolicy: 'OPEN',
      isOwner: false,
    }

    const { rerender } = render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route path="/events/:publicId" element={<EventPage viewer={null} loader={() => Promise.resolve({ event: baseEvent })} />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Sign in with a verified account/)).toBeVisible()

    rerender(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route
            path="/events/:publicId"
            element={
              <EventPage
                viewer={{ id: 'acct-1' }}
                loader={() => Promise.resolve({ event: baseEvent })}
                register={() => Promise.reject(new GraphqlClientError('Registration failed.'))}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Register for event' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed.')
  })

  it('shows compact event details and lets the owner manage participants', async () => {
    const loader = vi.fn().mockResolvedValue({
      event: {
        id: 'evt-1',
        publicId: 'board-vote',
        title: 'Board vote',
        description: null,
        location: null,
        registrationPolicy: 'ADMIN_MANAGED',
        isOwner: true,
        categories: [{ id: 'cat-1', title: 'Board vote participants', isDefault: true }],
      },
    })
    const participantsLoader = vi.fn().mockResolvedValue({
      participants: [{ accountId: 'acct-2', displayName: 'Guest', email: 'guest@example.com',
        entries: [{ id: 'entry-1', title: 'Guest entry' }], entryCount: 1 }],
    })
    const removeParticipant = vi.fn().mockResolvedValue({ archivedEntryIds: ['entry-1'], affectedParticipant: null })

    render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route
            path="/events/:publicId"
            element={
              <OwnerEventPage
                viewer={{ id: 'acct-1' }}
                loader={loader}
                participantsLoader={participantsLoader}
                removeParticipant={removeParticipant}
              />
            }
          />
          <Route path="/events/:publicId/participants" element={
            <OwnerEventParticipantsPage loader={loader} participantsLoader={participantsLoader}
              removeParticipant={removeParticipant} />
          } />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByRole('tab', { name: 'Entries' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('link', { name: 'Back to events' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Make open' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Participants' }))
    expect(await screen.findByRole('tab', { name: 'Entries' })).toBeVisible()

    expect(screen.queryByText('Add a participant')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeVisible()

    await user.click(screen.getAllByRole('button', { name: 'Remove participant' })[0])
    expect(removeParticipant).toHaveBeenCalledWith({ eventId: 'evt-1', accountId: 'acct-2',
      idempotencyKey: expect.any(String) })
  })

  it('shows owner page errors when loading fails', async () => {
    const failingLoader = vi.fn().mockRejectedValue(new GraphqlClientError('Could not load event.'))
    render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route path="/events/:publicId" element={<OwnerEventPage viewer={{ id: 'acct-1' }} loader={failingLoader} />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load event.')
  })

  it('falls back to public event rendering for non-owner event detail', async () => {
    render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route
            path="/events/:publicId"
            element={
              <OwnerEventPage
                viewer={{ id: 'acct-1' }}
                loader={() =>
                  Promise.resolve({
                    event: {
                      id: 'evt-1',
                      publicId: 'board-vote',
                      title: 'Board vote',
                      description: null,
                      location: null,
                      registrationPolicy: 'ADMIN_MANAGED',
                      isOwner: false,
                    },
                  })
                }
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Board vote' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Registration managed by the host' })).toBeVisible()
  })

  it('surfaces event errors in accessible alerts', async () => {
    render(
      <MemoryRouter>
        <EventDashboardPage
          viewer={{ email: 'host@example.com' }}
          loader={() => Promise.reject(new GraphqlClientError('Events are unavailable right now.'))}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Events are unavailable right now.')
  })

  it('shows an empty participant list before the host adds anyone', async () => {
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [] })}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Use Add, then choose Entry/)).toBeVisible()
  })

  it('surfaces participant remove failures', async () => {
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [{ id: 'reg-1', accountId: 'acct-1', email: 'guest@example.com', phone: null, accountCompleted: false }] })}
          removeParticipant={() => Promise.reject(new GraphqlClientError('Could not remove participant.'))}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText(/guest@example.com/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Remove participant' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove participant.')
  })
})
