import { normalizeEmail } from './security.js'

const TOKEN_PREFIX = 'test-verify'

function normalizeList(values = []) {
  return new Set(values.map((value) => String(value).trim().toLocaleLowerCase('en-US')).filter(Boolean))
}

export function createVerificationBypassPolicy({ emails = [], domains = [] } = {}) {
  const allowedEmails = normalizeList(emails)
  const allowedDomains = normalizeList(domains)

  function matches(email) {
    const normalizedEmail = normalizeEmail(email)
    const [, domain = ''] = normalizedEmail.split('@')
    return allowedEmails.has(normalizedEmail) || allowedDomains.has(domain)
  }

  function tokenFor(email) {
    return `${TOKEN_PREFIX}:${normalizeEmail(email)}`
  }

  return Object.freeze({
    enabled: allowedEmails.size > 0 || allowedDomains.size > 0,
    matches,
    tokenFor,
  })
}
