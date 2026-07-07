import { Readable } from 'node:stream'
import { buildSchema } from 'graphql'
import { describe, expect, it, vi } from 'vitest'
import { createGraphqlHandler } from '../../src/api/graphql/handler.js'

function request(body, headers = {}) {
  const stream = Readable.from([Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))])
  stream.method = 'POST'
  stream.headers = { 'content-type': 'application/json', ...headers }
  return stream
}

function response() {
  return { writeHead(status, headers) { this.status = status; this.headers = headers }, end(body) { this.body = JSON.parse(body) } }
}

const schema = buildSchema('type Query { ping: String! } type Mutation { change: Boolean! }')
const rootValue = { ping: () => 'pong', change: () => true }

describe('GraphQL handler', () => {
  it('executes bounded queries', async () => {
    const handler = createGraphqlHandler({ schema, rootValue, appOrigin: 'http://localhost:5173' })
    const result = response()
    await handler(request({ query: '{ ping }' }), result)
    expect(result.status).toBe(200)
    expect(result.body).toEqual({ data: { ping: 'pong' } })
  })

  it('requires same-origin proof for mutations', async () => {
    const handler = createGraphqlHandler({ schema, rootValue, appOrigin: 'http://localhost:5173' })
    const denied = response()
    await handler(request({ query: 'mutation { change }' }, { origin: 'https://attacker.example' }), denied)
    expect(denied.status).toBe(403)
  })

  it('accepts loopback aliases during local development mutations', async () => {
    const handler = createGraphqlHandler({ schema, rootValue, appOrigin: 'http://localhost:5173' })
    const accepted = response()
    await handler(request({ query: 'mutation { change }' }, {
      origin: 'http://127.0.0.1:5173',
      'x-requested-with': 'votiy-web',
    }), accepted)
    expect(accepted.status).toBe(200)
    expect(accepted.body).toEqual({ data: { change: true } })
  })

  it('keeps strict origin matching in production', async () => {
    const handler = createGraphqlHandler({
      schema,
      rootValue,
      appOrigin: 'http://localhost:5173',
      isProduction: true,
    })
    const denied = response()
    await handler(request({ query: 'mutation { change }' }, {
      origin: 'http://127.0.0.1:5173',
      'x-requested-with': 'votiy-web',
    }), denied)
    expect(denied.status).toBe(403)
  })

  it('enforces request bounds and rate-limit hooks', async () => {
    const limited = createGraphqlHandler({
      schema, rootValue, appOrigin: 'http://localhost:5173', maximumBodyBytes: 10,
    })
    const tooLarge = response()
    await limited(request({ query: '{ ping }' }), tooLarge)
    expect(tooLarge.status).toBe(413)

    const rateLimiter = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 30 })
    const handler = createGraphqlHandler({ schema, rootValue, appOrigin: 'http://localhost:5173', rateLimiter })
    const throttled = response()
    await handler(request({ query: '{ ping }' }), throttled)
    expect(throttled.status).toBe(429)
    expect(throttled.headers['Retry-After']).toBe('30')
  })
})
