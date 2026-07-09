import { Readable, Writable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { createApplication } from '../../src/app.js'
import { createGraphqlHandler } from '../../src/api/graphql/handler.js'
import { createHealthHandlers } from '../../src/api/health.js'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'
import { createLogger } from '../../src/observability/logger.js'
import { runWithRequestContext } from '../../src/observability/request-context.js'

function request({ url = '/graphql', method = 'POST', headers = {}, body = {} } = {}) {
  const stream = Readable.from([Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))])
  stream.url = url
  stream.method = method
  stream.headers = { 'content-type': 'application/json', ...headers }
  return stream
}

function response() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    writeHead(statusCode, headers = {}) {
      this.statusCode = statusCode
      this.headers = { ...this.headers, ...headers }
    },
    end(body = '') {
      this.body = body
    },
    once(_event, callback) {
      this.finish = callback
    },
  }
}

describe('security and failure behavior', () => {
  it('returns not_ready when Mongo dependency is unavailable', async () => {
    const handlers = createHealthHandlers({
      mongo: { isReady: vi.fn().mockResolvedValue(false) },
    })
    const res = response()
    await handlers.readyHandler({}, res)
    expect(res.statusCode).toBe(503)
    expect(JSON.parse(res.body)).toEqual({
      status: 'not_ready',
      dependencies: { mongodb: 'unavailable' },
    })
  })

  it('blocks oversized GraphQL requests, hostile origins, and throttled operations', async () => {
    const schema = await createGraphqlSchema()
    const rootValue = {
      viewer: () => ({
        __typename: 'OperationError',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Sign in to continue.',
        fieldErrors: [],
        correlationId: null,
      }),
    }
    const oversizedHandler = createGraphqlHandler({
      schema,
      rootValue,
      appOrigin: 'http://127.0.0.1:5173',
      maximumBodyBytes: 10,
    })
    const handler = createGraphqlHandler({
      schema,
      rootValue,
      appOrigin: 'http://127.0.0.1:5173',
      rateLimiter: async ({ operationName }) => ({ allowed: operationName !== 'Viewer', retryAfterSeconds: 15 }),
    })

    const tooLarge = response()
    await oversizedHandler(request({ body: { query: '{ viewer { __typename } }' } }), tooLarge)
    expect(tooLarge.statusCode).toBe(413)

    const forbidden = response()
    await handler(
      request({
        headers: { origin: 'https://evil.example' },
        body: {
          query: 'mutation Verify($input: VerifyEmailInput!) { verifyEmail(input: $input) { __typename } }',
          variables: { input: { token: 'x' } },
          operationName: 'Verify',
        },
      }),
      forbidden,
    )
    expect(forbidden.statusCode).toBe(403)

    const throttled = response()
    await handler(
      request({
        body: { query: 'query Viewer { viewer { __typename } }', operationName: 'Viewer' },
      }),
      throttled,
    )
    expect(throttled.statusCode).toBe(429)
    expect(throttled.headers['Retry-After']).toBe('15')
  })

  it('serves markup-like paths safely and keeps CSP active', async () => {
    const application = createApplication({
      frontendDirectory: '/missing-frontend',
      graphqlHandler: vi.fn(),
      healthHandler: vi.fn(),
      readyHandler: vi.fn(),
    })
    const res = response()
    await application(request({ url: '/<script>alert(1)</script>', method: 'GET', body: '' }), res)
    expect(res.statusCode).toBe(404)
    expect(res.body).toContain('Not found')
    expect(res.headers['Content-Security-Policy']).toContain("default-src 'self'")
  })

  it('redacts secrets from structured logs', () => {
    let logged = ''
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        logged += chunk.toString()
        callback()
      },
    })
    const logger = createLogger({ level: 'info' }, destination)
    runWithRequestContext({ correlationId: 'cid', startedAt: process.hrtime.bigint() }, () => {
      logger.info({
        password: 'super-secret',
        email: 'host@example.com',
        phone: '+15555550123',
        token: 'raw-token',
        nested: { token: 'inner-token' },
      }, 'security log')
    })
    expect(logged).toContain('[REDACTED]')
    expect(logged).not.toContain('host@example.com')
    expect(logged).not.toContain('super-secret')
    expect(logged).not.toContain('raw-token')
  })
})
