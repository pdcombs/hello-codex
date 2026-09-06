export const RESERVED_SHORT_IDS = new Set([
  'events', 'event', 'settings', 'user', 'users', 'account', 'accounts', 'admin', 'api', 'graphql', 'health',
  'ready', 'register', 'sign-in', 'signout', 'verify-email', 'forgot-password', 'reset-password', 'login',
  'logout', 'new', 'search', 'help', 'support', 'about', 'terms', 'privacy', 'assets', 'static', 'favicon', 'robots',
])

export function normalizeShortId(value) { return String(value ?? '').trim().toLowerCase() }

export function validateCustomShortId(value) {
  const shortId = normalizeShortId(value)
  if (RESERVED_SHORT_IDS.has(shortId)) return { success: false, reason: 'reserved', shortId }
  if (!/^[a-z0-9](?:[a-z0-9]|-(?!-)){1,48}[a-z0-9]$/.test(shortId)) {
    return { success: false, reason: 'format', shortId }
  }
  return { success: true, shortId }
}
