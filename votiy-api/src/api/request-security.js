export function isAllowedMutationOrigin(origin, appOrigin, isProduction = false) {
  if (origin === appOrigin) return true
  if (isProduction) return false
  try {
    const actual = new URL(origin)
    const expected = new URL(appOrigin)
    const loopback = (host) => host === 'localhost' || host === '127.0.0.1'
    return actual.protocol === expected.protocol && actual.port === expected.port
      && loopback(actual.hostname) && loopback(expected.hostname)
  } catch {
    return false
  }
}

export function hasMutationHeaders(request, appOrigin, isProduction = false) {
  return isAllowedMutationOrigin(request.headers.origin, appOrigin, isProduction)
    && request.headers['x-requested-with'] === 'votiy-web'
}
