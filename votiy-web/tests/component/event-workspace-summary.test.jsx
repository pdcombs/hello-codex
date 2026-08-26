import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EventWorkspaceSummary from '../../src/features/events/EventWorkspaceSummary.jsx'

const event = {
  id: 'event-1',
  publicId: 'public-1',
  title: 'Summer Showcase',
  description: 'Community favorites',
  location: 'Bentonville',
  isOwner: true,
  photo: null,
  analytics: { categoryCount: 3, participantCount: 5, entryCount: 8 },
}

describe('event workspace summary', () => {
  it('shows stable fallback, public counts, details, and owner settings', () => {
    render(<MemoryRouter><EventWorkspaceSummary event={event} /></MemoryRouter>)
    expect(screen.getByLabelText('Event analytics')).toHaveTextContent('3Categories5Participants8Entries')
    expect(screen.getByLabelText('Add a photo for Summer Showcase')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Event settings' })).toHaveAttribute('href', '/events/public-1/settings')
    expect(screen.getByText('Community favorites')).toBeVisible()
    expect(screen.getByText('Bentonville')).toBeVisible()
  })

  it('keeps public analytics but hides management controls', () => {
    render(<MemoryRouter><EventWorkspaceSummary event={{ ...event, isOwner: false }} /></MemoryRouter>)
    expect(screen.getByLabelText('Event analytics')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Event settings' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Summer Showcase has no photo')).toBeVisible()
  })

  it('places semantic voting information after the location with audience wording', () => {
    render(<MemoryRouter><EventWorkspaceSummary event={{ ...event, voting: { rules: {
      opensAt: '2030-01-01T12:00:00Z', closesAt: '2030-01-01T14:00:00Z', accessPolicy: 'CODE',
      defaultCategoryRule: { method: 'SINGLE' },
    } } }} /></MemoryRouter>)
    const summary = screen.getByLabelText('Voting information')
    expect(summary.previousElementSibling).toHaveTextContent('Bentonville')
    expect(summary).toHaveTextContent('Voters need a code to vote.')
    expect(summary).toHaveTextContent('Voters choose one entry in each category.')
    expect(summary.querySelectorAll('time')).toHaveLength(2)
    expect(summary.querySelector('time')).toHaveAttribute('datetime', '2030-01-01T12:00:00.000Z')
  })

  it('omits voting information for private summaries', () => {
    render(<MemoryRouter><EventWorkspaceSummary event={{ ...event, detailAccess: 'PRIVATE_SUMMARY',
      voting: { rules: { accessPolicy: 'CODE', defaultCategoryRule: { method: 'SINGLE' } } } }} /></MemoryRouter>)
    expect(screen.queryByLabelText('Voting information')).not.toBeInTheDocument()
  })
})
