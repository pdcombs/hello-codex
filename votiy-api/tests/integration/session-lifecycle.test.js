import argon2 from 'argon2'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { digestSecret, generateOpaqueToken } from '../../src/domain/security.js'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createSessionRepository } from '../../src/repositories/session-repository.js'
import { createAuthenticationService } from '../../src/services/authentication-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('real Mongo session lifecycle', () => {
  let mongo, service
  beforeAll(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
    const accounts = createAccountRepository(mongo.database)
    const sessions = createSessionRepository(mongo.database)
    const passwordHash = await argon2.hash('a sufficiently long password')
    const account = await accounts.createPending({ emailNormalized: 'host@example.com', passwordHash })
    await accounts.markVerified(account._id, new Date())
    service = createAuthenticationService({
      accountRepository: accounts,
      sessionRepository: sessions,
      passwordHasher: { verify: argon2.verify },
      digestSessionSecret: (v) => digestSecret(v, 'integration-session-pepper-value'),
      generateSessionSecret: generateOpaqueToken,
      sessionTtlSeconds: 3600,
    })
  })
  afterAll(async () => mongo?.cleanup())
  it('creates, recognizes, and revokes an opaque session', async () => {
    const signedIn = await service.signIn({ email: 'host@example.com', password: 'a sufficiently long password' })
    await expect(service.viewer({ secret: signedIn.sessionSecret })).resolves.toMatchObject({
      account: { emailNormalized: 'host@example.com' },
    })
    await service.signOut({ secret: signedIn.sessionSecret })
    await expect(service.viewer({ secret: signedIn.sessionSecret })).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
    })
  })
})
