import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import PrivateEventNotice from '../../src/features/search/PrivateEventNotice.jsx'
import EventPage from '../../src/features/events/EventPage.jsx'

describe('private event view', () => {
  it('explains protected content without rendering it', () => {
    render(<PrivateEventNotice />)
    expect(screen.getByRole('note')).toHaveTextContent('private event')
    expect(screen.getByRole('note')).toHaveTextContent('not visible')
  })

  it('does not request voting capability for a private summary', async () => {
    const capabilityLoader = vi.fn()
    const loader = vi.fn().mockResolvedValue({ event: { __typename: 'PrivateEventSummary', publicId: 'private',
      title: 'Private event', description: 'Protected', detailAccess: 'PRIVATE_SUMMARY', isOwner: false,
      categories: [], voting: { rules: { accessPolicy: 'CODE' } }, analytics: {
        categoryCount: 0, participantCount: 0, entryCount: 0,
      } } })
    render(<MemoryRouter initialEntries={['/events/private']}><Routes>
      <Route path="/events/:publicId" element={<EventPage loader={loader} capabilityLoader={capabilityLoader} />} />
    </Routes></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('note')).toBeVisible())
    expect(capabilityLoader).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Voting information')).not.toBeInTheDocument()
  })
})
