import { Readable, Writable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { createApplication, securityHeaders } from '../../src/app.js'
import { createHealthHandlers } from '../../src/api/health.js'
import { createSessionContext } from '../../src/api/graphql/session-context.js'
import { createEmailSender, verificationEmail } from '../../src/email/email-sender.js'
import { createFakeSender } from '../../src/email/fake-sender.js'
import { createProviderSender } from '../../src/email/provider-sender.js'
import { createLogger, logRequestCompletion } from '../../src/observability/logger.js'
import {
  correlationIdFromRequest,
  getRequestContext,
  requireRequestContext,
  runWithRequestContext,
} from '../../src/observability/request-context.js'

describe('platform support helpers', () => {
  it('builds secure response headers and application routing shells', async () => {
    expect(securityHeaders('application/json')['X-Frame-Options']).toBe('DENY')

    const app = createApplication({
      frontendDirectory: '/missing',
      graphqlHandler: vi.fn(),
      healthHandler: vi.fn((_, response) => {
        response.writeHead(200, { 'Content-Type': 'application/json' })
        response.end('{}')
      }),
      readyHandler: vi.fn(),
    })
    const request = Readable.from([])
    request.method = 'POST'
    request.url = '/unknown'
    request.headers = {}
    const response = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) { this.headers[name] = value },
      writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = { ...this.headers, ...headers } },
      end(body = '') { this.body = body },
      once(_event, callback) { callback() },
    }
    await app(request, response)
    expect(response.statusCode).toBe(404)
    expect(response.headers['X-Correlation-ID']).toBeTruthy()

    process.env.APP_COMMIT_SHA = 'abc1234'
    const homeRequest = Readable.from([])
    homeRequest.method = 'HEAD'
    homeRequest.url = '/'
    homeRequest.headers = {}
    const homeResponse = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) { this.headers[name] = value },
      writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = { ...this.headers, ...headers } },
      end(body = '') { this.body = body },
      once(_event, callback) { callback() },
    }
    await app(homeRequest, homeResponse)
    expect(homeResponse.headers['X-App-Commit']).toBe('abc1234')
    delete process.env.APP_COMMIT_SHA
  })

  it('creates health handlers and session context cookie helpers', async () => {
    const handlers = createHealthHandlers({ mongo: { isReady: vi.fn().mockResolvedValue(true) } })
    const res = { writeHead(status, headers) { this.status = status; this.headers = headers }, end(body) { this.body = body } }
    handlers.healthHandler({}, res)
    expect(res.status).toBe(200)

    const response = { setHeader: vi.fn() }
    const context = createSessionContext({
      request: { headers: { cookie: 'votiy_session=abc123' } },
      response,
      correlationId: 'cid',
      environment: { sessionCookieName: 'votiy_session', isProduction: false, sessionTtlSeconds: 60 },
    })
    expect(context.session).toEqual({ secret: 'abc123' })
    context.setSessionCookie('new-secret')
    context.clearSessionCookie()
    expect(response.setHeader).toHaveBeenCalledTimes(2)
  })

  it('builds email payloads and provider wrappers', async () => {
    const email = verificationEmail({
      email: 'host@example.com',
      token: 'verify-token',
      appOrigin: 'http://127.0.0.1:5173',
      from: 'Votiy <no-reply@votiy.app>',
    })
    expect(email.text).toContain('/verify-email?token=verify-token')

    const transport = { send: vi.fn().mockResolvedValue({ ok: true }) }
    const sender = createEmailSender({
      transport,
      appOrigin: 'http://127.0.0.1:5173',
      from: 'Votiy <no-reply@votiy.app>',
    })
    await sender.send({ email: 'host@example.com', token: 'verify-token' })
    expect(transport.send).toHaveBeenCalledOnce()

    const fake = createFakeSender()
    await fake.send(email)
    expect(fake.deliveries).toHaveLength(1)
    fake.clear()
    expect(fake.deliveries).toHaveLength(0)

    const provider = createProviderSender({
      endpoint: 'https://provider.example/send',
      apiKey: 'secret',
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accepted: true }),
      }),
    })
    await expect(provider.send(email)).resolves.toEqual({ accepted: true })
  })

  it('handles request context and logger redaction', () => {
    expect(correlationIdFromRequest({ headers: { 'x-correlation-id': 'Good_Id-1234' } })).toBe('Good_Id-1234')
    expect(correlationIdFromRequest({ headers: { 'x-correlation-id': 'bad id' } })).not.toBe('bad id')

    expect(getRequestContext()).toBeUndefined()
    expect(() => requireRequestContext()).toThrow('Request context is unavailable')

    let logged = ''
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        logged += chunk.toString()
        callback()
      },
    })
    const logger = createLogger({ level: 'info', environment: 'test' }, destination)
    runWithRequestContext({ correlationId: 'cid', startedAt: process.hrtime.bigint() }, () => {
      expect(requireRequestContext().correlationId).toBe('cid')
      logger.info({ email: 'host@example.com', token: 'secret-token' }, 'hello')
    })
    expect(logged).toContain('[REDACTED]')
    expect(logged).not.toContain('host@example.com')

    logRequestCompletion(logger, {
      request: { method: 'POST', url: '/graphql' },
      response: { statusCode: 200 },
      correlationId: 'cid',
      startedAt: process.hrtime.bigint() - 1_000_000n,
    })
    expect(logged).toContain('request.completed')
  })
})
