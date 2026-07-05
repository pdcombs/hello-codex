import { randomUUID } from 'node:crypto'
import argon2 from 'argon2'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { digestIdempotencyRequest, digestSecret, generateOpaqueToken } from '../../src/domain/security.js'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { createIdempotencyRepository } from '../../src/repositories/idempotency-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createSessionRepository } from '../../src/repositories/session-repository.js'
import { createVerificationRepository } from '../../src/repositories/verification-repository.js'
import { createRegistrationService } from '../../src/services/registration-service.js'
import { createVerificationService } from '../../src/services/verification-service.js'
import { createFakeEmailSender } from '../support/fake-email.js'
import { createTestMongo } from '../support/mongo.js'

const TOKEN_PEPPER = 'integration-test-token-pepper-value'

describe('account registration with real MongoDB', () => {
  let mongo
  let accountRepository
  let verificationRepository
  let sessionRepository
  let idempotencyRepository
  let emailSender
  let registrationService
  let verificationService

  beforeAll(async () => {
    mongo = await createTestMongo()
    await ensureCollectionsAndIndexes(mongo.database)
  })

  afterAll(async () => {
    await mongo?.cleanup()
  })

  beforeEach(async () => {
    await Promise.all(
      ['accounts', 'emailVerifications', 'sessions', 'idempotencyRecords', 'auditEvents'].map((name) =>
        mongo.database.collection(name).deleteMany({}),
      ),
    )

    accountRepository = createAccountRepository(mongo.database)
    verificationRepository = createVerificationRepository(mongo.database)
    sessionRepository = createSessionRepository(mongo.database)
    idempotencyRepository = createIdempotencyRepository(mongo.database)
    emailSender = createFakeEmailSender()

    registrationService = createRegistrationService({
      accountRepository,
      verificationRepository,
      idempotencyRepository,
      emailSender,
      passwordHasher: { hash: (password) => argon2.hash(password, { type: argon2.argon2id }) },
      generateToken: generateOpaqueToken,
      digestToken: (token) => digestSecret(token, TOKEN_PEPPER),
      digestRequest: digestIdempotencyRequest,
      verificationTtlSeconds: 3_600,
    })

    verificationService = createVerificationService({
      accountRepository,
      verificationRepository,
      sessionRepository,
      emailSender,
      generateToken: generateOpaqueToken,
      digestToken: (token) => digestSecret(token, TOKEN_PEPPER),
      generateSessionSecret: generateOpaqueToken,
      digestSessionSecret: (secret) => digestSecret(secret, TOKEN_PEPPER),
      verificationTtlSeconds: 3_600,
      sessionTtlSeconds: 86_400,
    })
  })

  async function register(email = 'host@example.com') {
    return registrationService.register({
      email,
      password: 'a sufficiently long password',
      idempotencyKey: randomUUID(),
    })
  }

  it('enforces one account for concurrent differently-cased normalized emails', async () => {
    const results = await Promise.allSettled([register(' Host@Example.COM '), register('host@example.com')])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1)
    expect(results.find(({ status }) => status === 'rejected').reason).toMatchObject({
      code: ErrorCode.CONFLICT,
    })
    expect(await mongo.database.collection('accounts').countDocuments()).toBe(1)
    expect(await mongo.database.collection('accounts').findOne()).toMatchObject({
      emailNormalized: 'host@example.com',
      referredByAccountId: null,
      lifecycleStatus: 'completed',
      verificationStatus: 'pending',
    })
  })

  it('stores a password hash and delivers one fake email containing only the raw verification token', async () => {
    await register()

    const account = await mongo.database.collection('accounts').findOne()
    const verification = await mongo.database.collection('emailVerifications').findOne()
    expect(account.passwordHash).not.toContain('sufficiently long password')
    await expect(argon2.verify(account.passwordHash, 'a sufficiently long password')).resolves.toBe(true)
    expect(emailSender.deliveries).toHaveLength(1)
    expect(emailSender.deliveries[0]).toMatchObject({ email: 'host@example.com' })
    expect(verification.tokenDigest).toBe(digestSecret(emailSender.deliveries[0].token, TOKEN_PEPPER))
    expect(JSON.stringify(verification)).not.toContain(emailSender.deliveries[0].token)
  })

  it('consumes a verification exactly once under concurrent requests and creates one session', async () => {
    await register()
    const token = emailSender.deliveries[0].token

    const results = await Promise.allSettled([
      verificationService.verifyEmail({ token }),
      verificationService.verifyEmail({ token }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    expect(results.find(({ status }) => status === 'rejected').reason).toMatchObject({
      code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    })
    expect(await mongo.database.collection('sessions').countDocuments()).toBe(1)
    expect(await mongo.database.collection('accounts').findOne()).toMatchObject({
      verificationStatus: 'verified',
      verifiedAt: expect.any(Date),
    })
  })

  it('rejects an expired verification without changing the account or creating a session', async () => {
    await register()
    const token = emailSender.deliveries[0].token
    await mongo.database
      .collection('emailVerifications')
      .updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1_000) } })

    await expect(verificationService.verifyEmail({ token })).rejects.toMatchObject({
      code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    })
    expect(await mongo.database.collection('sessions').countDocuments()).toBe(0)
    expect(await mongo.database.collection('accounts').findOne()).toMatchObject({
      verificationStatus: 'pending',
      verifiedAt: null,
    })
  })

  it('returns the original result for an idempotent retry without duplicate email or records', async () => {
    const input = {
      email: 'host@example.com',
      password: 'a sufficiently long password',
      idempotencyKey: randomUUID(),
    }

    const first = await registrationService.register(input)
    const retry = await registrationService.register(input)

    expect(retry.account._id).toEqual(first.account._id)
    expect(await mongo.database.collection('accounts').countDocuments()).toBe(1)
    expect(await mongo.database.collection('emailVerifications').countDocuments()).toBe(1)
    expect(emailSender.deliveries).toHaveLength(1)
  })
})
