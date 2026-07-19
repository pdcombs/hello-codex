import { parseCookie } from 'cookie'
import { expiredSessionCookie, sessionCookie } from '../../domain/session.js'

export function createSessionContext({ request, response, correlationId, environment }) {
  const cookies = parseCookie(request.headers.cookie ?? '')
  const secret = cookies[environment.sessionCookieName]
  const votingCookieName = 'votiy_voter'
  function appendCookie(value) {
    const current = response.getHeader?.('Set-Cookie')
    response.setHeader('Set-Cookie', current ? [...(Array.isArray(current) ? current : [current]), value] : value)
  }
  return {
    correlationId,
    session: secret ? { secret } : null,
    votingBrowserMarker: cookies[votingCookieName] ?? null,
    setVotingBrowserMarker(value) {
      appendCookie(sessionCookie(value, { name: votingCookieName, isProduction: environment.isProduction,
        maxAge: 31_536_000 }))
    },
    setSessionCookie(value) {
      appendCookie(sessionCookie(value, {
          name: environment.sessionCookieName,
          isProduction: environment.isProduction,
          maxAge: environment.sessionTtlSeconds,
        }))
    },
    clearSessionCookie() {
      appendCookie(expiredSessionCookie({
          name: environment.sessionCookieName,
          isProduction: environment.isProduction,
        }))
    },
  }
}
