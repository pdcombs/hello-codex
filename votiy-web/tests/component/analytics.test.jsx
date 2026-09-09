import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsConsentProvider } from '../../src/analytics/AnalyticsConsent.jsx'
import {
  CONSENT_KEY,
  createAnalytics,
  isProductionAnalyticsHost,
  normalizeRoute,
  readConsent,
  safeButtonAction,
} from '../../src/analytics/analytics.js'

beforeEach(() => {
  const values = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    clear: () => values.clear(),
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('analytics privacy boundary', () => {
  it('enables only exact production hosts', () => {
    expect(isProductionAnalyticsHost('votiy.com')).toBe(true)
    expect(isProductionAnalyticsHost('www.votiy.com')).toBe(true)
    expect(isProductionAnalyticsHost('preview.votiy.com')).toBe(false)
    expect(isProductionAnalyticsHost('localhost')).toBe(false)
  })

  it('normalizes identifiers, aliases, queries, and fragments', () => {
    expect(normalizeRoute('/events/secret-id/results?code=SECRET#entry')).toEqual({ route: '/events/:eventId/results', title: 'Event results' })
    expect(normalizeRoute('/my-private-event')).toEqual({ route: '/:shortLink', title: 'Event short link' })
    expect(normalizeRoute('/reset-password?token=SECRET')).toEqual({ route: '/reset-password', title: 'Reset password' })
  })

  it('uses catalog actions and redacts dynamic button labels', () => {
    const safe = document.createElement('button')
    safe.textContent = 'Open voting'
    expect(safeButtonAction(safe)).toBe('Open voting')
    safe.textContent = 'Delete Pat@example.com from Secret Event'
    expect(safeButtonAction(safe)).toBe('Other button')
  })

  it('orders denied consent before config and sends only normalized fields', () => {
    const calls = []
    const windowRef = { location: { hostname: 'votiy.com' }, dataLayer: [], gtag: (...args) => calls.push(args), localStorage: { getItem: () => 'declined' } }
    const appended = []
    const documentRef = { createElement: () => ({ dataset: {} }), head: { appendChild: (node) => appended.push(node) } }
    const client = createAnalytics({ windowRef, documentRef })
    client.initialize('declined')
    client.send('page_view', { pathname: '/events/private-id/results?code=SECRET', ignored: 'Pat@example.com' })
    expect(calls[0][0]).toBe('consent')
    expect(calls[0][2].analytics_storage).toBe('denied')
    expect(calls.find((call) => call[0] === 'config')[2].send_page_view).toBe(false)
    const event = calls.find((call) => call[0] === 'event')
    expect(event).toEqual(['event', 'page_view', { page_route: '/events/:eventId/results', page_title: 'Event results' }])
    expect(JSON.stringify(calls)).not.toContain('private-id')
    expect(JSON.stringify(calls)).not.toContain('SECRET')
    expect(appended[0].src).toContain('G-3KJEB4ZGRH')
  })

  it('sends nothing and inserts no tag outside production', () => {
    const appendChild = vi.fn()
    const gtag = vi.fn()
    const client = createAnalytics({ windowRef: { location: { hostname: 'localhost' }, gtag }, documentRef: { createElement: vi.fn(), head: { appendChild } } })
    expect(client.initialize('accepted')).toBe(false)
    client.send('button_click', { pathname: '/', actionName: 'Vote' })
    expect(gtag).not.toHaveBeenCalled()
    expect(appendChild).not.toHaveBeenCalled()
  })

  it('handles corrupt or unavailable preference storage', () => {
    expect(readConsent({ getItem: () => 'bad-value' })).toBe('undecided')
    expect(readConsent({ getItem: () => { throw new Error('blocked') } })).toBe('undecided')
  })
})

describe('analytics consent UI', () => {
  it('offers equal accept and decline choices and remembers a choice', async () => {
    const user = userEvent.setup()
    render(<AnalyticsConsentProvider><p>Application</p></AnalyticsConsentProvider>)
    expect(screen.getByRole('dialog', { name: 'Cookie preferences' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept' })).toHaveClass('primary-action')
    await user.click(screen.getByRole('button', { name: 'Decline' }))
    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
