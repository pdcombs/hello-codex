import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createRegistrationService } from '../../src/services/registration-service.js'

const NOW = new Date('2026-07-05T12:00:00.000Z')
const INPUT = Object.freeze({
  email: '  New.Host@Example.COM  ',
  password: 'a sufficiently long password',
  idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
})

function createHarness(overrides = {}) {
  const account = Object.freeze({
    _id: 'account-1',
    emailNormalized: 'new.host@example.com',
    lifecycleStatus: 'completed',
    verificationStatus: 'pending',
  })
  const accountRepository = {
    findByEmailNormalized: vi.fn().mockResolvedValue(null),
    createPending: vi.fn().mockResolvedValue(account),
  }
  const verificationRepository = {
    supersedeActiveForAccount: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({ _id: 'verification-1' }),
    createOrRefreshReusable: vi.fn().mockResolvedValue({ _id: 'verification-reusable-1' }),
  }
  const idempotencyRepository = {
    find: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(undefined),
  }
  const passwordHasher = { hash: vi.fn().mockResolvedValue('argon2id-password-hash') }
  const emailSender = { send: vi.fn().mockResolvedValue(undefined) }

  const dependencies = {
    accountRepository,
    verificationRepository,
    idempotencyRepository,
    passwordHasher,
    emailSender,
    generateToken: vi.fn().mockReturnValue('raw-verification-token'),
    digestToken: vi.fn().mockReturnValue('verification-token-digest'),
    digestRequest: vi.fn().mockReturnValue('same-request-digest'),
    now: vi.fn().mockReturnValue(NOW),
    verificationTtlSeconds: 3_600,
    verificationBypassPolicy: { matches: vi.fn().mockReturnValue(false), tokenFor: vi.fn() },
    ...overrides,
  }

  return {
    account,
    accountRepository,
    verificationRepository,
    idempotencyRepository,
    passwordHasher,
    emailSender,
    service: createRegistrationService(dependencies),
  }
}

describe('registration service', () => {
  it('normalizes email, hashes the accepted password, and creates a pending completed account', async () => {
    const harness = createHarness()

    const result = await harness.service.register(INPUT)

    expect(harness.accountRepository.findByEmailNormalized).toHaveBeenCalledWith('new.host@example.com')
    expect(harness.passwordHasher.hash).toHaveBeenCalledWith(INPUT.password)
    expect(harness.accountRepository.createPending).toHaveBeenCalledWith(
      expect.objectContaining({
        emailNormalized: 'new.host@example.com',
        phoneNormalized: null,
        referredByAccountId: null,
        lifecycleStatus: 'completed',
        passwordHash: 'argon2id-password-hash',
        verificationStatus: 'pending',
        verifiedAt: null,
        credentialVersion: 0,
      }),
    )
    expect(result.account).toBe(harness.account)
  })

  it.each([
    ['invalid email', { ...INPUT, email: 'not-an-email' }, 'email'],
    ['short password', { ...INPUT, password: 'too-short' }, 'password'],
    ['overlong password', { ...INPUT, password: 'x'.repeat(129) }, 'password'],
  ])('rejects %s before hashing or persistence', async (_label, input, field) => {
    const harness = createHarness()

    await expect(harness.service.register(input)).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      fieldErrors: expect.arrayContaining([expect.objectContaining({ field })]),
    })
    expect(harness.passwordHasher.hash).not.toHaveBeenCalled()
    expect(harness.accountRepository.createPending).not.toHaveBeenCalled()
  })

  it('issues one expiring verification and delivers only the raw token', async () => {
    const harness = createHarness()

    await harness.service.register(INPUT)

    expect(harness.verificationRepository.supersedeActiveForAccount).toHaveBeenCalledWith('account-1', NOW)
    expect(harness.verificationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        tokenDigest: 'verification-token-digest',
        expiresAt: new Date('2026-07-05T13:00:00.000Z'),
        consumedAt: null,
      }),
    )
    expect(harness.emailSender.send).toHaveBeenCalledWith({
      email: 'new.host@example.com',
      token: 'raw-verification-token',
    })
    expect(harness.idempotencyRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'new.host@example.com',
        operation: 'register',
        key: INPUT.idempotencyKey,
        requestDigest: 'same-request-digest',
        resultReference: { accountId: 'account-1' },
      }),
    )
    expect(JSON.stringify(harness.verificationRepository.create.mock.calls)).not.toContain('raw-verification-token')
  })

  it('stores a reusable bypass token and returns it instead of sending email for allowlisted test accounts', async () => {
    const verificationBypassPolicy = {
      matches: vi.fn().mockReturnValue(true),
      tokenFor: vi.fn().mockReturnValue('test-verify:new.host@example.com'),
    }
    const harness = createHarness({ verificationBypassPolicy })

    const result = await harness.service.register(INPUT)

    expect(verificationBypassPolicy.matches).toHaveBeenCalledWith('new.host@example.com')
    expect(verificationBypassPolicy.tokenFor).toHaveBeenCalledWith('new.host@example.com')
    expect(harness.verificationRepository.createOrRefreshReusable).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        tokenDigest: 'verification-token-digest',
        expiresAt: new Date('2026-07-05T13:00:00.000Z'),
      }),
    )
    expect(harness.verificationRepository.create).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
    expect(result.verificationToken).toBe('test-verify:new.host@example.com')
  })

  it('suppresses a normalized duplicate without hashing, writing, or sending email', async () => {
    const harness = createHarness()
    harness.accountRepository.findByEmailNormalized.mockResolvedValue({ _id: 'existing-account' })

    await expect(harness.service.register(INPUT)).rejects.toMatchObject({ code: ErrorCode.CONFLICT })
    expect(harness.passwordHasher.hash).not.toHaveBeenCalled()
    expect(harness.accountRepository.createPending).not.toHaveBeenCalled()
    expect(harness.verificationRepository.create).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
  })

  it('returns the original result for an identical idempotent retry without repeating side effects', async () => {
    const harness = createHarness()
    harness.idempotencyRepository.find.mockResolvedValue({
      requestDigest: 'same-request-digest',
      resultReference: { accountId: 'account-1' },
    })
    harness.accountRepository.findById = vi.fn().mockResolvedValue(harness.account)

    const result = await harness.service.register(INPUT)

    expect(result.account).toBe(harness.account)
    expect(harness.accountRepository.findById).toHaveBeenCalledWith('account-1')
    expect(harness.passwordHasher.hash).not.toHaveBeenCalled()
    expect(harness.verificationRepository.create).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
  })

  it('returns the deterministic bypass token for an idempotent retry of an allowlisted test registration', async () => {
    const verificationBypassPolicy = {
      matches: vi.fn().mockReturnValue(true),
      tokenFor: vi.fn().mockReturnValue('test-verify:new.host@example.com'),
    }
    const harness = createHarness({ verificationBypassPolicy })
    harness.idempotencyRepository.find.mockResolvedValue({
      requestDigest: 'same-request-digest',
      resultReference: { accountId: 'account-1' },
    })
    harness.accountRepository.findById = vi.fn().mockResolvedValue(harness.account)

    const result = await harness.service.register(INPUT)

    expect(result.verificationToken).toBe('test-verify:new.host@example.com')
    expect(harness.verificationRepository.createOrRefreshReusable).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
  })

  it('rejects reuse of an idempotency key with different registration input', async () => {
    const harness = createHarness({
      digestRequest: vi.fn().mockReturnValue('different-request-digest'),
    })
    harness.idempotencyRepository.find.mockResolvedValue({
      requestDigest: 'original-request-digest',
      resultReference: { accountId: 'account-1' },
    })

    await expect(harness.service.register(INPUT)).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
    })
    expect(harness.accountRepository.createPending).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
  })
})
