import { Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { createEventPhotoHandler } from '../../src/api/event-photo-handler.js'

function response() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value },
    getHeader(name) { return this.headers[name] },
    writeHead(status, headers = {}) { this.statusCode = status; Object.assign(this.headers, headers) },
    end(body) { this.body = body },
  }
}

function request({ method = 'GET', url, headers = {}, body = Buffer.alloc(0) }) {
  const stream = Readable.from(body.length ? [body] : [])
  stream.method = method
  stream.url = url
  stream.headers = headers
  return stream
}

describe('event photo HTTP contract', () => {
  it('serves public media with cache revalidation and HEAD semantics', async () => {
    const data = Buffer.from('webp')
    const service = { read: vi.fn().mockResolvedValue({
      data, contentType: 'image/webp', byteLength: data.length, etag: '"etag"',
    }) }
    const handler = createEventPhotoHandler({ service, authenticate: vi.fn(), appOrigin: 'http://localhost:5173' })
    const first = response()
    await handler(request({ url: '/event-media/demo/photo' }), first)
    expect(first.statusCode).toBe(200)
    expect(first.headers).toMatchObject({ 'Content-Type': 'image/webp', ETag: '"etag"',
      'Cache-Control': 'public, max-age=0, must-revalidate' })
    const cached = response()
    await handler(request({ url: '/event-media/demo/photo', headers: { 'if-none-match': '"etag"' } }), cached)
    expect(cached.statusCode).toBe(304)
  })

  it('requires same-origin owner mutation headers', async () => {
    const handler = createEventPhotoHandler({
      service: {},
      authenticate: vi.fn(),
      appOrigin: 'http://localhost:5173',
    })
    const denied = response()
    await handler(request({ method: 'DELETE', url: '/api/events/507f1f77bcf86cd799439011/photo',
      headers: { origin: 'https://evil.example', 'x-requested-with': 'votiy-web',
        'x-idempotency-key': 'key' } }), denied)
    expect(denied.statusCode).toBe(403)
    expect(JSON.parse(denied.body)).toMatchObject({ code: 'FORBIDDEN' })
  })

  it('uploads bounded content and deletes through the owner service', async () => {
    const service = {
      upload: vi.fn().mockResolvedValue({ created: true, photo: { revision: 1 } }),
      remove: vi.fn().mockResolvedValue({ deleted: true, deletedRevision: 1 }),
    }
    const handler = createEventPhotoHandler({
      service,
      authenticate: vi.fn().mockResolvedValue({ account: { _id: 'owner' } }),
      appOrigin: 'http://localhost:5173',
    })
    const mutationHeaders = { origin: 'http://localhost:5173', 'x-requested-with': 'votiy-web',
      'x-idempotency-key': 'key' }
    const uploaded = response()
    await handler(request({ method: 'PUT', url: '/api/events/507f1f77bcf86cd799439011/photo',
      headers: { ...mutationHeaders, 'content-type': 'image/jpeg', 'content-length': '4' },
      body: Buffer.from('jpeg') }), uploaded)
    expect(uploaded.statusCode).toBe(201)
    expect(service.upload).toHaveBeenCalledWith(expect.objectContaining({ bytes: Buffer.from('jpeg') }))
    const removed = response()
    await handler(request({ method: 'DELETE', url: '/api/events/507f1f77bcf86cd799439011/photo',
      headers: mutationHeaders }), removed)
    expect(removed.statusCode).toBe(200)
  })

  it('returns safe not-found and declared-size errors', async () => {
    const handler = createEventPhotoHandler({
      service: { read: vi.fn().mockResolvedValue(null), upload: vi.fn() },
      authenticate: vi.fn().mockResolvedValue({ account: { _id: 'owner' } }),
      appOrigin: 'http://localhost:5173',
    })
    const missing = response()
    await handler(request({ url: '/event-media/missing/photo' }), missing)
    expect(missing.statusCode).toBe(404)
    const oversized = response()
    await handler(request({ method: 'PUT', url: '/api/events/507f1f77bcf86cd799439011/photo',
      headers: { origin: 'http://localhost:5173', 'x-requested-with': 'votiy-web',
        'x-idempotency-key': 'key', 'content-type': 'image/jpeg', 'content-length': String(11 * 1024 * 1024) } }),
    oversized)
    expect(oversized.statusCode).toBe(413)
  })
})
