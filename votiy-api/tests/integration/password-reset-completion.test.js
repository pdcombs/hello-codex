import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createPasswordResetRepository } from '../../src/repositories/password-reset-repository.js'
import { createSessionRepository } from '../../src/repositories/session-repository.js'
import { createPasswordResetService } from '../../src/services/password-reset-service.js'
import { createTestMongo } from '../support/mongo.js'

describe('password reset with real MongoDB', () => {
  let mongo; let account; let service; let delivered
  beforeAll(async () => {
    mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database)
    const accounts = createAccountRepository(mongo.database)
    account = await accounts.createPending({ displayName: 'Reset User', emailNormalized: 'reset@example.com',
      passwordHash: 'old-hash', now: new Date('2030-01-01T00:00:00Z') })
    account = await accounts.markVerified(account._id, new Date('2030-01-01T00:00:01Z'))
    const resetRepository = createPasswordResetRepository(mongo.database)
    service = createPasswordResetService({ accountRepository: accounts, resetRepository,
      sessionRepository: createSessionRepository(mongo.database),
      emailSender: { sendPasswordReset: async (message) => { delivered = message } },
      digestToken: (token) => `digest:${token}`, generateToken: () => 'mongo-reset-token-123456789',
      passwordHasher: { hash: async () => 'new-hash' }, verificationBypassPolicy: { matches: () => false },
      withTransaction: async (operation) => { const session = mongo.client.startSession(); try {
        let result; await session.withTransaction(async () => { result = await operation(session) }); return result
      } finally { await session.endSession() } },
      now: () => new Date('2030-01-01T00:01:00Z'), logger: { info() {} } })
  })
  afterAll(async () => mongo?.cleanup())
  it('retains digest-only audit, exposes linked email, consumes once, updates credential', async () => {
    await service.request({ email: 'reset@example.com' }); expect(delivered.token).toBe('mongo-reset-token-123456789')
    const stored = await mongo.database.collection('passwordResetRequests').findOne({ accountId: account._id })
    expect(stored).toMatchObject({ tokenDigest: 'digest:mongo-reset-token-123456789', status: 'active' })
    expect(stored).not.toHaveProperty('token')
    expect(stored.expiresAt.getTime() - stored.createdAt.getTime()).toBe(15 * 60 * 1000)
    expect(await service.inspect({ token: delivered.token })).toMatchObject({ email: 'reset@example.com' })
    await service.reset({ token: delivered.token, password: 'new-password-123', passwordConfirmation: 'new-password-123' })
    const updated = await mongo.database.collection('accounts').findOne({ _id: account._id })
    expect(updated).toMatchObject({ passwordHash: 'new-hash', credentialVersion: 1 })
    await expect(service.reset({ token: delivered.token, password: 'new-password-123',
      passwordConfirmation: 'new-password-123' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
  })
})
