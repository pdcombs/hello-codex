import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { correlationIdFromRequest, runWithRequestContext } from './observability/request-context.js'
import { logRequestCompletion } from './observability/logger.js'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

export function securityHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}

function safeFrontendPath(frontendDirectory, requestUrl) {
  const pathname = new URL(requestUrl, 'http://localhost').pathname
  const requestedPath = pathname === '/' ? '/index.html' : pathname
  const candidate = normalize(join(frontendDirectory, requestedPath))
  return candidate.startsWith(`${frontendDirectory}/`) ? candidate : join(frontendDirectory, 'index.html')
}

async function serveFrontend(request, response, frontendDirectory) {
  const filePath = safeFrontendPath(frontendDirectory, request.url)

  try {
    const file = await readFile(filePath)
    response.writeHead(200, securityHeaders(contentTypes[extname(filePath)] ?? 'application/octet-stream'))
    if (request.method === 'HEAD') return response.end()
    response.end(file)
  } catch {
    try {
      const index = await readFile(join(frontendDirectory, 'index.html'))
      response.writeHead(200, securityHeaders('text/html; charset=utf-8'))
      if (request.method === 'HEAD') return response.end()
      response.end(index)
    } catch {
      response.writeHead(404, securityHeaders('application/json'))
      response.end(JSON.stringify({ error: 'Not found' }))
    }
  }
}

export function createApplication({ frontendDirectory, graphqlHandler, healthHandler, readyHandler, logger }) {
  if (!frontendDirectory || !graphqlHandler || !healthHandler) {
    throw new TypeError('frontendDirectory, graphqlHandler, and healthHandler are required')
  }

  return async function application(request, response) {
    const correlationId = correlationIdFromRequest(request)
    const startedAt = process.hrtime.bigint()
    response.setHeader('X-Correlation-ID', correlationId)
    if (logger) response.once('finish', () => logRequestCompletion(logger, { request, response, correlationId, startedAt }))

    return runWithRequestContext({ correlationId, startedAt }, async () => {
      const pathname = new URL(request.url, 'http://localhost').pathname

      if (pathname === '/health') return healthHandler(request, response)
      if (pathname === '/ready' && readyHandler) return readyHandler(request, response)
      if (pathname === '/graphql') return graphqlHandler(request, response)
      if (request.method === 'GET' || request.method === 'HEAD') {
        return serveFrontend(request, response, frontendDirectory)
      }

      response.writeHead(404, securityHeaders('application/json'))
      response.end(JSON.stringify({ error: 'Not found' }))
    })
  }
}
