import { describe, expect, it, vi } from 'vitest'
import { GraphqlClientError, graphqlRequest, unwrapGraphqlResult } from '../../src/lib/graphql.js'

function response(payload, { ok = true, correlationId = null } = {}) {
  return {
    ok,
    headers: { get: (name) => name === 'x-correlation-id' ? correlationId : null },
    json: vi.fn().mockResolvedValue(payload),
  }
}

describe('GraphQL client', () => {
  it('uses the same-origin session and request-proof headers', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ data: { viewer: { __typename: 'SessionSuccess' } } }))
    const data = await graphqlRequest({ query: '{ viewer { __typename } }', fetchImpl })
    expect(data.viewer.__typename).toBe('SessionSuccess')
    expect(fetchImpl).toHaveBeenCalledWith('/graphql', expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      headers: expect.objectContaining({ 'X-Requested-With': 'votiy-web' }),
    }))
  })

  it('surfaces typed operation errors', () => {
    expect(() => unwrapGraphqlResult({
      __typename: 'OperationError',
      code: 'VALIDATION_FAILED',
      message: 'Check the fields.',
      fieldErrors: [{ field: 'title', code: 'required', message: 'Required' }],
      correlationId: 'correlation-1',
    })).toThrow(GraphqlClientError)
  })

  it('preserves correlation IDs on transport failures', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(
      { error: 'Invalid GraphQL request' },
      { ok: false, correlationId: 'correlation-2' },
    ))
    await expect(graphqlRequest({ query: '{ viewer { __typename } }', fetchImpl }))
      .rejects.toMatchObject({ correlationId: 'correlation-2', code: 'SERVICE_UNAVAILABLE' })
  })

  it('maps network failures to a recoverable client error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(graphqlRequest({ query: '{ viewer { __typename } }', fetchImpl }))
      .rejects.toBeInstanceOf(GraphqlClientError)
  })
})
