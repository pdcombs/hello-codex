import { describe, expect, it, vi } from 'vitest'
import { createSessionContext } from '../../src/api/graphql/session-context.js'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('voter access contract', () => {
  it('accepts provisional voter input without exposing private contact on capability', async () => {
    const schema = await createGraphqlSchema()
    const input = schema.getType('ProvisionalVoterInput').getFields()
    expect(Object.keys(input)).toEqual(['email', 'phone'])
    expect(schema.getType('EventVotingCapability').getFields()).not.toHaveProperty('email')
    expect(validateGraphqlOperation(schema, `query C($id: ID!) { eventVotingCapability(eventId: $id) {
      ... on EventVotingCapabilitySuccess { capability { canVote reasonCode remainingBallots hasEventAccess } } } }`).errors)
      .toEqual([])
  })

  it('reads and appends secure HttpOnly voting marker cookie', () => {
    const headers = new Map(); const response = { getHeader: (name) => headers.get(name),
      setHeader: vi.fn((name, value) => headers.set(name, value)) }
    const context = createSessionContext({ request: { headers: { cookie: 'votiy_voter=marker-1' } }, response,
      correlationId: 'cookie-1', environment: { sessionCookieName: 'session', isProduction: true,
        sessionTtlSeconds: 100 } })
    expect(context.votingBrowserMarker).toBe('marker-1')
    context.setVotingBrowserMarker('marker-2')
    expect(headers.get('Set-Cookie')).toContain('HttpOnly')
    expect(headers.get('Set-Cookie')).toContain('Secure')
    expect(headers.get('Set-Cookie')).toContain('SameSite=Lax')
  })
})
