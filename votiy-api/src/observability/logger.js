import pino from 'pino'

const redactPaths = [
  'password', '*.password', 'req.headers.authorization', 'req.headers.cookie',
  'request.headers.authorization', 'request.headers.cookie', 'token', '*.token',
  'email', '*.email', 'phone', '*.phone',
  'displayName', '*.displayName', 'title', '*.title',
]

export function createLogger({ level = 'info', environment = 'development' } = {}, destination) {
  return pino({
    level,
    base: { service: 'votiy-api', environment },
    redact: { paths: redactPaths, censor: '[REDACTED]' },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
  }, destination)
}

export function logRequestCompletion(logger, { request, response, correlationId, startedAt }) {
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
  logger.info({
    event: 'request.completed',
    operation: `${request.method} ${new URL(request.url, 'http://localhost').pathname}`,
    status: response.statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    correlationId,
  }, 'Request completed')
}

export function logGroupedView(logger, { outcome, durationMs, categoryCount = 0, entryCount = 0, errorCode = null }) {
  logger?.[outcome === 'success' ? 'info' : 'error']({
    event: 'event.setup_view.completed', operation: 'event.setup_view', outcome,
    durationMs: Math.round(durationMs * 100) / 100, categoryCount, entryCount,
    ...(errorCode ? { errorCode } : {}),
  }, outcome === 'success' ? 'Event setup view loaded' : 'Event setup view failed')
}
