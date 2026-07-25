import { securityHeaders } from '../app.js'
import { ApplicationError, ErrorCode, toClientError } from '../domain/errors.js'
import { EVENT_PHOTO_LIMITS } from '../domain/event-photo.js'
import { getRequestContext } from '../observability/request-context.js'
import { hasMutationHeaders } from './request-security.js'

async function readBounded(request) {
  const declared = Number(request.headers['content-length'])
  if (!Number.isInteger(declared) || declared < 1) throw new ApplicationError(ErrorCode.INVALID_IMAGE)
  if (declared > EVENT_PHOTO_LIMITS.inputBytes) throw new ApplicationError(ErrorCode.IMAGE_TOO_LARGE)
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > EVENT_PHOTO_LIMITS.inputBytes) throw new ApplicationError(ErrorCode.IMAGE_TOO_LARGE)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function json(response, status, body, extra = {}) {
  response.writeHead(status, { ...securityHeaders('application/json'), ...extra })
  response.end(JSON.stringify(body))
}

const statusFor = (code) => ({
  [ErrorCode.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.IMAGE_TOO_LARGE]: 413,
  [ErrorCode.UNSUPPORTED_IMAGE_TYPE]: 415,
  [ErrorCode.INVALID_IMAGE]: 400,
  [ErrorCode.IMAGE_PROCESSING_FAILED]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
}[code] ?? 503)

export function createEventPhotoHandler({ service, authenticate, appOrigin, isProduction = false }) {
  return async function eventPhotoHandler(request, response) {
    const pathname = new URL(request.url, 'http://localhost').pathname
    const mutationMatch = pathname.match(/^\/api\/events\/([^/]+)\/photo$/)
    const readMatch = pathname.match(/^\/event-media\/([^/]+)\/photo$/)
    const correlationId = getRequestContext()?.correlationId ?? response.getHeader('X-Correlation-ID') ?? 'event-photo'
    try {
      if (readMatch) {
        if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: 'Method not allowed' }, { Allow: 'GET, HEAD' })
        const photo = await service.read(decodeURIComponent(readMatch[1]))
        if (!photo) return json(response, 404, { error: 'Not found', correlationId })
        const headers = {
          'Content-Type': photo.contentType,
          'Content-Length': photo.byteLength,
          ETag: photo.etag,
          'Cache-Control': 'public, max-age=0, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        }
        if (request.headers['if-none-match'] === photo.etag) {
          response.writeHead(304, headers)
          return response.end()
        }
        response.writeHead(200, headers)
        return response.end(request.method === 'HEAD' ? undefined : photo.data.buffer ?? photo.data)
      }
      if (!mutationMatch || !['PUT', 'DELETE'].includes(request.method)) return false
      if (!hasMutationHeaders(request, appOrigin, isProduction)) throw new ApplicationError(ErrorCode.FORBIDDEN)
      const viewer = await authenticate(request)
      const idempotencyKey = request.headers['x-idempotency-key']
      if (!idempotencyKey) throw new ApplicationError(ErrorCode.VALIDATION_FAILED)
      const eventId = decodeURIComponent(mutationMatch[1])
      if (request.method === 'PUT') {
        const result = await service.upload({
          eventId,
          bytes: await readBounded(request),
          contentType: request.headers['content-type'],
          idempotencyKey,
          viewer,
          correlationId,
        })
        return json(response, result.created ? 201 : 200, { photo: result.photo, correlationId })
      }
      const result = await service.remove({ eventId, idempotencyKey, viewer, correlationId })
      return json(response, 200, { ...result, correlationId })
    } catch (error) {
      const client = toClientError(error, correlationId)
      return json(response, statusFor(client.code), client)
    }
  }
}
