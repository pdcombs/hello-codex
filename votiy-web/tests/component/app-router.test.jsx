import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AppErrorBoundary from '../../src/app/AppErrorBoundary.jsx'
import { AppRoutes } from '../../src/app/AppRouter.jsx'

describe('application routes', () => {
  it('shows an informational home page to visitors', () => {
    render(<MemoryRouter><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create your account' })).toBeVisible()
  })

  it('switches the home page to the hosted-events dashboard for signed-in users', () => {
    render(<MemoryRouter><AppRoutes viewer={{ email: 'host@example.com' }} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
  })

  it('renders one event detail and its actions', () => {
    render(<MemoryRouter initialEntries={['/events/event-123']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByText('Event reference: event-123')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Event actions' })).toBeVisible()
  })
})

describe('error boundary', () => {
  it('renders an accessible recovery state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Broken() { throw new Error('boom') }
    render(<AppErrorBoundary><Broken /></AppErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('Votiy hit an unexpected snag.')
    vi.restoreAllMocks()
  })
})
