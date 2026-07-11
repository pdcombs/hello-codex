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
      },
    })
    const participantsLoader = vi.fn().mockResolvedValue({
      registrations: [{ id: 'reg-1', accountId: 'acct-2', email: 'guest@example.com', phone: null, accountCompleted: false }],
    })
    const addParticipant = vi.fn().mockResolvedValue({
      registration: { id: 'reg-2', accountId: 'acct-3', email: 'new@example.com', phone: null, accountCompleted: false },
    })
    const removeParticipant = vi.fn().mockResolvedValue({
      registration: { id: 'reg-1' },
    })

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
                addParticipant={addParticipant}
                removeParticipant={removeParticipant}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText('Admin managed')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to events' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Make open' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(await screen.findByText(/new@example\.com/)).toBeVisible()
    expect(screen.getAllByText(/provisional account/i)[0]).toBeVisible()

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(removeParticipant).toHaveBeenCalledWith({ eventId: 'evt-1', registrationId: 'reg-1' })
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
          addParticipant={vi.fn()}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(await screen.findByText('No participants registered yet.')).toBeVisible()
  })

  it('surfaces participant add and remove failures', async () => {
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [{ id: 'reg-1', accountId: 'acct-1', email: 'guest@example.com', phone: null, accountCompleted: false }] })}
          addParticipant={() => Promise.reject(new GraphqlClientError('Could not add participant.'))}
          removeParticipant={() => Promise.reject(new GraphqlClientError('Could not remove participant.'))}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText(/guest@example.com/)).toBeVisible()
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not add participant.')
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove participant.')
  })

  it('replaces existing participant row when add returns same registration id', async () => {
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [{ id: 'reg-1', accountId: 'acct-1', email: 'guest@example.com', phone: null, accountCompleted: false }] })}
          addParticipant={() => Promise.resolve({ registration: { id: 'reg-1', accountId: 'acct-1', email: 'guest@example.com', phone: null, accountCompleted: true } })}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText(/guest@example.com/)).toBeVisible()
    await user.type(screen.getByLabelText('Email'), 'guest@example.com')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(await screen.findByText('Account complete')).toBeVisible()
  })

  it('highlights participant fields and identifies validation failures', async () => {
    const addParticipant = vi.fn()
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [] })}
          addParticipant={addParticipant}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText('No participants registered yet.')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Phone')).not.toHaveAttribute('aria-invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('Email: Enter an email address.')
    expect(screen.getByText('Optional')).toBeVisible()
    expect(addParticipant).not.toHaveBeenCalled()
  })

  it('shows API field errors and accepts email without phone', async () => {
    const addParticipant = vi
      .fn()
      .mockRejectedValueOnce(
        new GraphqlClientError('Check the highlighted fields and try again.', {
          code: 'VALIDATION_FAILED',
          fieldErrors: [{ field: 'email', code: 'invalid_format', message: 'Enter a valid email address' }],
        }),
      )
      .mockResolvedValueOnce({
        registration: { id: 'reg-2', accountId: 'acct-2', email: 'email-only@example.com', phone: null, accountCompleted: false },
      })

    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [] })}
          addParticipant={addParticipant}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText('No participants registered yet.')).toBeVisible()
    await user.type(screen.getByLabelText('Email'), 'valid@example.com')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Email: Enter a valid email address')

    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'email-only@example.com')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))
    expect(addParticipant).toHaveBeenCalledWith(expect.objectContaining({ email: 'email-only@example.com', phone: null }))
    expect(await screen.findByText('email-only@example.com')).toBeVisible()
  })

  it('submits both email and phone for one participant', async () => {
    const addParticipant = vi.fn().mockResolvedValue({
      registration: {
        id: 'reg-both',
        accountId: 'acct-both',
        email: 'both@example.com',
        phone: '+15551234567',
        accountCompleted: false,
      },
    })
    render(
      <MemoryRouter>
        <EventParticipantsPanel
          eventId="evt-1"
          loader={() => Promise.resolve({ registrations: [] })}
          addParticipant={addParticipant}
          removeParticipant={vi.fn()}
        />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    expect(await screen.findByText('No participants registered yet.')).toBeVisible()
    await user.type(screen.getByLabelText('Email'), 'both@example.com')
    await user.type(screen.getByLabelText('Phone'), '(555) 123-4567')
    await user.click(screen.getByRole('button', { name: 'Add participant' }))

    expect(addParticipant).toHaveBeenCalledWith(expect.objectContaining({
      email: 'both@example.com',
      phone: '+15551234567',
    }))
    expect(await screen.findByText('both@example.com')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
    expect(screen.getByLabelText('Phone')).toHaveValue('')
  })
})
