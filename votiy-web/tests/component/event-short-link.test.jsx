import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EventShortLinkEditor from '../../src/features/events/EventShortLinkEditor.jsx'
import EventShortLinkRedirect from '../../src/features/events/EventShortLinkRedirect.jsx'

const event = { id: 'event-1', publicId: 'Public_1', shortId: 'Public_1', updatedAt: '2030-01-01T00:00:00Z',
  lifecycleStatus: 'ACTIVE' }

describe('event short link UI', () => {
  it('lowercases and saves host alias', async () => {
    const saver = vi.fn().mockResolvedValue({ event: { ...event, shortId: 'my-event' } })
    render(<EventShortLinkEditor event={event} saver={saver} onSaved={vi.fn()} />)
    const input = screen.getByLabelText(/Event Short Url:/)
    await userEvent.clear(input); await userEvent.type(input, 'My-Event')
    expect(input).toHaveValue('my-event')
    await userEvent.click(screen.getByRole('button', { name: 'Save short URL' }))
    expect(saver).toHaveBeenCalledWith({ eventId: 'event-1', shortId: 'my-event', expectedUpdatedAt: event.updatedAt })
  })

  it('redirects resolved alias to canonical event route', async () => {
    render(<MemoryRouter initialEntries={['/my-event']}><Routes>
      <Route path="/:shortId" element={<EventShortLinkRedirect loader={vi.fn().mockResolvedValue({ publicId: 'Public_1' })} />} />
      <Route path="/events/:publicId" element={<h1>Canonical event</h1>} />
    </Routes></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Canonical event' })).toBeVisible()
  })

  it('shows taken message', async () => {
    const error = Object.assign(new Error('Conflict'), { code: 'SHORT_LINK_TAKEN' })
    render(<EventShortLinkEditor event={event} saver={vi.fn().mockRejectedValue(error)} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Save short URL' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('already taken')
  })
})
