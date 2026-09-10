import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsConsentProvider, useAnalyticsConsent } from '../../src/analytics/AnalyticsConsent.jsx'
import {
  CONSENT_KEY,
  createAnalytics,
  isProductionAnalyticsHost,
  normalizeRoute,
  readConsent,
  safeButtonAction,
} from '../../src/analytics/analytics.js'
import {
  ANALYTICS_EVENTS,
  BUTTON_EVENTS_BY_ACTION,
  ERROR_EVENTS_BY_NAME,
  buttonEventName,
  errorEventName,
} from '../../src/analytics/analytics-events.js'

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
    expect(buttonEventName('Open voting')).toBe('click_open_voting_button')
    expect(buttonEventName('Private dynamic label')).toBe('click_other_button')
  })

  it('keeps every provider event name unique and provider-safe', () => {
    const names = Object.values(ANALYTICS_EVENTS)
    expect(new Set(names).size).toBe(names.length)
    names.forEach((name) => {
      expect(name).toMatch(/^[a-z][a-z0-9_]{0,39}$/)
      expect(name.length).toBeLessThanOrEqual(40)
    })
    expect(BUTTON_EVENTS_BY_ACTION.get('Vote')).toBe(ANALYTICS_EVENTS.CLICK_VOTE_BUTTON)
    expect(ERROR_EVENTS_BY_NAME.get('Service unavailable')).toBe(ANALYTICS_EVENTS.ERROR_SERVICE_UNAVAILABLE)
    expect(errorEventName('Raw private error')).toBe(ANALYTICS_EVENTS.ERROR_ACTION_NOT_COMPLETED)
  })

  it('orders denied consent before config and sends only normalized fields', () => {
    const calls = []
    const windowRef = { location: { hostname: 'votiy.com' }, dataLayer: [], gtag: (...args) => calls.push(args), localStorage: { getItem: () => 'declined' } }
    const appended = []
    const documentRef = { createElement: () => ({ dataset: {} }), head: { appendChild: (node) => appended.push(node) } }
    const client = createAnalytics({ windowRef, documentRef })
    client.initialize('declined')
    client.send(ANALYTICS_EVENTS.PAGE_VIEW, { pathname: '/events/private-id/results?code=SECRET', ignored: 'Pat@example.com' })
    client.send(ANALYTICS_EVENTS.CLICK_VOTE_BUTTON, { pathname: '/events/private-id/results', actionName: 'Vote', ignored: 'SECRET' })
    client.send(ANALYTICS_EVENTS.ERROR_SERVICE_UNAVAILABLE, { pathname: '/events/private-id/results', errorName: 'Service unavailable', ignored: 'Pat@example.com' })
    expect(calls[0][0]).toBe('consent')
    expect(calls[0][2].analytics_storage).toBe('denied')
    expect(calls.find((call) => call[0] === 'config')[2].send_page_view).toBe(false)
    const events = calls.filter((call) => call[0] === 'event')
    expect(events).toEqual([
      ['event', 'page_view', { page_route: '/events/:eventId/results', page_title: 'Event results' }],
      ['event', 'click_vote_button', { page_route: '/events/:eventId/results', action_name: 'Vote' }],
      ['event', 'error_service_unavailable', { page_route: '/events/:eventId/results', error_name: 'Service unavailable', operation_name: 'Event action' }],
    ])
    expect(JSON.stringify(calls)).not.toContain('private-id')
    expect(JSON.stringify(calls)).not.toContain('SECRET')
    expect(appended[0].src).toContain('G-3KJEB4ZGRH')
  })

  it('sends nothing and inserts no tag outside production', () => {
    const appendChild = vi.fn()
    const gtag = vi.fn()
    const client = createAnalytics({ windowRef: { location: { hostname: 'localhost' }, gtag }, documentRef: { createElement: vi.fn(), head: { appendChild } } })
    expect(client.initialize('accepted')).toBe(false)
    client.send(ANALYTICS_EVENTS.CLICK_VOTE_BUTTON, { pathname: '/', actionName: 'Vote' })
    expect(gtag).not.toHaveBeenCalled()
    expect(appendChild).not.toHaveBeenCalled()
  })

  it('rejects event names absent from the centralized catalog', () => {
    const gtag = vi.fn()
    const windowRef = { location: { hostname: 'votiy.com' }, gtag, localStorage: { getItem: () => 'declined' } }
    const documentRef = { createElement: () => ({ dataset: {} }), head: { appendChild: vi.fn() } }
    const client = createAnalytics({ windowRef, documentRef })
    client.initialize('declined')
    expect(client.send('inline_private_event', { pathname: '/' })).toBe(false)
    expect(gtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
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

  it('honors saved choices and lets visitors reopen preferences', async () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    const user = userEvent.setup()
    function PreferenceControl() {
      const { preference, openPreferences } = useAnalyticsConsent()
      return <><span>{preference}</span><button onClick={openPreferences}>Analytics preferences</button></>
    }
    render(<AnalyticsConsentProvider><PreferenceControl /></AnalyticsConsentProvider>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('accepted')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Analytics preferences' }))
    await user.click(screen.getByRole('button', { name: 'Decline' }))
    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined')
  })
})
