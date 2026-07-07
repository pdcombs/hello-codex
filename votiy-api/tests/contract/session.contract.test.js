import { graphql } from 'graphql'
import { describe, expect, it, vi } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'
import { createSessionResolvers } from '../../src/api/graphql/session-resolvers.js'

const account = { id: 'a1', email: 'host@example.com', isVerified: true, createdAt: new Date('2026-07-06T00:00:00Z') }
describe('session GraphQL contract', () => {
  it('signs in, sets cookie, and signs out by clearing cookie', async () => {
    const authenticationService = {
      signIn: vi.fn().mockResolvedValue({ account, sessionSecret: 'secret' }),
      signOut: vi.fn().mockResolvedValue({ signedOut: true }),
    }
    const rootValue = createSessionResolvers({ authenticationService })
    const setSessionCookie = vi.fn()
    const clearSessionCookie = vi.fn()
    const schema = await createGraphqlSchema()
    const contextValue = { correlationId: 'c1', session: { secret: 'secret' }, setSessionCookie, clearSessionCookie }
    const signedIn = await graphql({
      schema,
      rootValue,
      contextValue,
      source:
        'mutation { signIn(input:{email:"host@example.com",password:"password"}) { __typename ... on SessionSuccess { session { account { email } } } } }',
    })
    expect(signedIn.errors).toBeUndefined()
    expect(setSessionCookie).toHaveBeenCalledWith('secret')
    const signedOut = await graphql({
      schema,
      rootValue,
      contextValue,
      source: 'mutation { signOut { __typename ... on SignOutSuccess { signedOut } } }',
    })
    expect(signedOut.data.signOut.signedOut).toBe(true)
    expect(clearSessionCookie).toHaveBeenCalled()
  })
})
