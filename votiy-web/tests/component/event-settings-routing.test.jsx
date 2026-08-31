import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EventSettingsPage from '../../src/features/events/EventSettingsPage.jsx'
import OwnerEventResultsPage from '../../src/features/events/OwnerEventResultsPage.jsx'

const event = { id: 'event-1', publicId: 'demo', title: 'Demo', isOwner: true, categories: [],
  photo: null, analytics: { categoryCount: 0, participantCount: 0, entryCount: 0 }, voting: null }

describe('event workspace subroutes', () => {
  it('loads owner settings with a Back control', async () => {
    render(<MemoryRouter initialEntries={['/events/demo/settings']}><Routes>
      <Route path="/events/:publicId/settings" element={<EventSettingsPage loader={async () => ({ event })} />} />
    </Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Event settings' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to event entries' })).toHaveAttribute('href', '/events/demo')
  })

  it('denies settings to non-owner', async () => {
    render(<MemoryRouter initialEntries={['/events/demo/settings']}><Routes>
      <Route path="/events/:publicId/settings" element={<EventSettingsPage loader={async () =>
        ({ event: { ...event, isOwner: false } })} />} />
    </Routes></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Only the event host')
  })

  it('renders voting results under selected URL tab', async () => {
    render(<MemoryRouter initialEntries={['/events/demo/results']}><Routes>
      <Route path="/events/:publicId/results" element={<OwnerEventResultsPage loader={async () =>
        ({ event, votesReceived: 0, categories: [] })} />} />
    </Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Voting results' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true')
  })
})
