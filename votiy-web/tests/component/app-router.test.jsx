import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App.jsx'
import AppErrorBoundary from '../../src/app/AppErrorBoundary.jsx'
import { AppRoutes } from '../../src/app/AppRouter.jsx'

describe('application routes', () => {
  it('renders through the production application entry component', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
  })
  it('shows an informational home page to visitors', () => {
    render(<MemoryRouter><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Create your account' })).toBeVisible()
  })

  it('switches the home page to the hosted-events dashboard for signed-in users', () => {
    render(<MemoryRouter><AppRoutes viewer={{ email: 'host@example.com' }} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeVisible()
  })

  it('renders one event detail and its actions', () => {
    render(<MemoryRouter initialEntries={['/events/event-123']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByText('event-123')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('Loading event')
  })

  it('renders placeholder and not-found routes safely', () => {
    const { rerender } = render(<MemoryRouter initialEntries={['/register']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    rerender(<MemoryRouter key="missing" initialEntries={['/missing']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })

  it('redirects protected create-event route to sign in for visitors', () => {
    render(<MemoryRouter initialEntries={['/events/new']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  it('redirects signed-in visitors away from sign-in page', () => {
    render(<MemoryRouter initialEntries={['/sign-in']}><AppRoutes viewer={{ email: 'host@example.com' }} /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
  })
})

describe('error boundary', () => {
  it('renders an accessible recovery state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    function Broken() { throw new Error('boom') }
    render(<AppErrorBoundary onError={onError}><Broken /></AppErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('Votiy hit an unexpected snag.')
    expect(onError).toHaveBeenCalledOnce()
    vi.restoreAllMocks()
  })
})
