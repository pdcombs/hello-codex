import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/app/AppRouter.jsx'
import EventParticipantsPanel from '../../src/features/events/EventParticipantsPanel.jsx'
import OwnerEventPage from '../../src/features/events/OwnerEventPage.jsx'

describe('accessibility and responsive shells', () => {
  it('exposes skip link and accessible primary navigation on public shell', async () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus()
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
  })

  it('keeps sign-out reachable for signed-in shell', () => {
    render(
      <MemoryRouter>
        <AppRoutes viewer={{ email: 'host@example.com' }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'Create event' }).length).toBeGreaterThan(0)
  })

  it('labels participant controls and renders empty state text', async () => {
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

    expect(await screen.findByRole('heading', { name: 'No participants yet' })).toBeVisible()
    expect(screen.getByLabelText('Email')).toBeVisible()
    expect(screen.getByLabelText('Phone')).toBeVisible()
  })

  it('renders owner event page with accessible heading', async () => {
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

    render(
      <MemoryRouter initialEntries={['/events/board-vote']}>
        <Routes>
          <Route path="/events/:publicId" element={<OwnerEventPage viewer={{ id: 'acct-1' }} loader={loader} />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Board vote' })).toBeVisible()
  })
})
