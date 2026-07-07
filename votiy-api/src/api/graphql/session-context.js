import { parseCookie } from 'cookie'
import { expiredSessionCookie, sessionCookie } from '../../domain/session.js'

export function createSessionContext({ request, response, correlationId, environment }) {
  const cookies = parseCookie(request.headers.cookie ?? '')
  const secret = cookies[environment.sessionCookieName]
  return {
    correlationId,
    session: secret ? { secret } : null,
    setSessionCookie(value) {
      response.setHeader(
        'Set-Cookie',
        sessionCookie(value, {
          name: environment.sessionCookieName,
          isProduction: environment.isProduction,
          maxAge: environment.sessionTtlSeconds,
        }),
      )
    },
    clearSessionCookie() {
      response.setHeader(
        'Set-Cookie',
        expiredSessionCookie({
          name: environment.sessionCookieName,
          isProduction: environment.isProduction,
        }),
      )
    },
  }
}
