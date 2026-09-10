export const MEASUREMENT_ID = 'G-3KJEB4ZGRH'
export const CONSENT_KEY = 'votiy.analytics-consent'
const PRODUCTION_HOSTS = new Set(['votiy.com', 'www.votiy.com'])
const STATIC_ROUTES = new Map([
  ['/', 'Home'], ['/events/new', 'Create event'], ['/register', 'Create account'],
  ['/verify-email', 'Verify email'], ['/forgot-password', 'Forgot password'],
  ['/reset-password', 'Reset password'], ['/sign-in', 'Sign in'], ['/privacy', 'Privacy'],
])
const EVENT_SUFFIXES = new Map([
  ['', 'Event details'], ['/participants', 'Event participants'], ['/results', 'Event results'],
  ['/settings', 'Event settings'], ['/vote', 'Vote'], ['/votes', 'Previous votes'],
])
const SAFE_ACTIONS = new Map([
  ['search events', 'Search events'], ['sign out', 'Sign out'], ['open voting', 'Open voting'],
  ['close voting', 'Close voting'], ['vote', 'Vote'], ['submit vote', 'Submit vote'],
  ['save event details', 'Save event details'], ['save short url', 'Save short URL'],
  ['download qr code', 'Download QR code'], ['accept', 'Accept'],
  ['decline', 'Decline'], ['analytics preferences', 'Analytics preferences'],
  ['refresh page', 'Refresh page'], ['close', 'Close'], ['cancel', 'Cancel'], ['continue', 'Continue'],
  ['sign in', 'Sign in'], ['create account', 'Create account'], ['save', 'Save'], ['delete', 'Delete'],
])

export function isProductionAnalyticsHost(hostname = '') {
  return PRODUCTION_HOSTS.has(String(hostname).toLowerCase())
}

export function normalizeRoute(pathname = '/') {
  const path = String(pathname).split(/[?#]/, 1)[0] || '/'
  if (STATIC_ROUTES.has(path)) return { route: path, title: STATIC_ROUTES.get(path) }
  const match = path.match(/^\/events\/[^/]+(\/participants|\/results|\/settings|\/vote|\/votes)?\/?$/)
  if (match && EVENT_SUFFIXES.has(match[1] ?? '')) {
    const suffix = match[1] ?? ''
    return { route: `/events/:eventId${suffix}`, title: EVENT_SUFFIXES.get(suffix) }
  }
  if (/^\/[^/]+\/?$/.test(path)) return { route: '/:shortLink', title: 'Event short link' }
  return { route: '/not-found', title: 'Page not found' }
}

export function safeButtonAction(button) {
  const explicit = button?.dataset?.analyticsAction
  if (explicit && [...SAFE_ACTIONS.values()].includes(explicit)) return explicit
  const text = String(button?.getAttribute?.('aria-label') || button?.textContent || '').trim().replace(/\s+/g, ' ').toLowerCase()
  return SAFE_ACTIONS.get(text) ?? 'Other button'
}

export function operationForRoute(route) {
  if (route.includes('/vote')) return 'Voting action'
  if (route.startsWith('/events')) return 'Event action'
  if (['/register', '/verify-email', '/forgot-password', '/reset-password', '/sign-in'].includes(route)) return 'Account action'
  if (route === '/privacy') return 'Privacy action'
  return 'Application action'
}

export function classifyAlert(element) {
  const approved = element?.dataset?.analyticsError
  const errors = new Set(['Validation failed', 'Sign in required', 'Permission denied', 'Request conflicted', 'Resource not found', 'Too many requests', 'Service unavailable', 'Network request failed', 'Unexpected application error', 'Action could not be completed'])
  return errors.has(approved) ? approved : 'Action could not be completed'
}

export function readConsent(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem(CONSENT_KEY)
    return value === 'accepted' || value === 'declined' ? value : 'undecided'
  } catch { return 'undecided' }
}

export function createAnalytics({ windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  const enabled = isProductionAnalyticsHost(windowRef?.location?.hostname)
  let initialized = false
  const recent = new Map()
  const gtag = (...args) => { try { windowRef?.gtag?.(...args) } catch { /* analytics is fail-open */ } }

  function initialize(preference = 'undecided') {
    if (!enabled || initialized || !windowRef || !documentRef) return false
    initialized = true
    windowRef.dataLayer = windowRef.dataLayer || []
    windowRef.gtag = windowRef.gtag || function googleTag() { windowRef.dataLayer.push(arguments) }
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 })
    if (preference === 'accepted') gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
    gtag('js', new Date())
    gtag('config', MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false })
    const script = documentRef.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
    script.dataset.votiyAnalytics = 'true'
    documentRef.head?.appendChild(script)
    return true
  }

  function updateConsent(status) {
    if (!enabled) return
    initialize(status)
    gtag('consent', 'update', { analytics_storage: status === 'accepted' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
  }

  function send(eventName, values) {
    if (!enabled || !isAnalyticsEventName(eventName)) return false
    if (!initialized) initialize(readConsent(windowRef?.localStorage))
    const route = normalizeRoute(values?.pathname).route
    const params = { page_route: route }
    if (eventName === ANALYTICS_EVENTS.PAGE_VIEW) params.page_title = normalizeRoute(values?.pathname).title
    if (isButtonEventName(eventName)) params.action_name = values.actionName
    if (isErrorEventName(eventName)) {
      params.error_name = values.errorName
      params.operation_name = operationForRoute(route)
    }
    const signature = JSON.stringify([eventName, params])
    const now = Date.now()
    if (!isButtonEventName(eventName) && now - (recent.get(signature) ?? 0) < 750) return false
    recent.set(signature, now)
    gtag('event', eventName, params)
    return true
  }

  return { enabled, initialize, updateConsent, send }
}

export const analytics = createAnalytics()
import { ANALYTICS_EVENTS, isAnalyticsEventName, isButtonEventName, isErrorEventName } from './analytics-events.js'
