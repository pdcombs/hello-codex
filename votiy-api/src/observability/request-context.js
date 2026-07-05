import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

const requestStorage = new AsyncLocalStorage()
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/

export function correlationIdFromRequest(request) {
  const supplied = request.headers['x-correlation-id']
  return typeof supplied === 'string' && CORRELATION_ID_PATTERN.test(supplied) ? supplied : randomUUID()
}

export function runWithRequestContext(context, callback) {
  return requestStorage.run(Object.freeze({ ...context }), callback)
}

export function getRequestContext() {
  return requestStorage.getStore()
}

export function requireRequestContext() {
  const context = getRequestContext()
  if (!context) throw new Error('Request context is unavailable')
  return context
}
