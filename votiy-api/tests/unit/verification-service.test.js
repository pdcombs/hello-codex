import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createVerificationService } from '../../src/services/verification-service.js'

const NOW = new Date('2026-07-05T12:00:00.000Z')

function createHarness(overrides = {}) {
  const account = {
    _id: 'account-1',
    emailNormalized: 'host@example.com',
    lifecycleStatus: 'completed',
    verificationStatus: 'pending',
    verifiedAt: null,
    credentialVersion: 0,
  }
  const verification = {
    _id: 'verification-1',
    accountId: account._id,
    tokenDigest: 'verification-token-digest',
    expiresAt: new Date('2026-07-05T13:00:00.000Z'),
    consumedAt: null,
  }
  const verificationRepository = {
    consumeActive: vi.fn().mockResolvedValue(verification),
    supersedeActiveForAccount: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({ _id: 'verification-2' }),
  }
  const accountRepository = {
    findById: vi.fn().mockResolvedValue(account),
    markVerified: vi.fn().mockResolvedValue({
      ...account,
      verificationStatus: 'verified',
      verifiedAt: NOW,
    }),
  }
  const sessionRepository = {
    revokeActiveForAccount: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({ _id: 'session-1' }),
  }
  const emailSender = { send: vi.fn().mockResolvedValue(undefined) }
  const dependencies = {
    verificationRepository,
    accountRepository,
    sessionRepository,
    emailSender,
    digestToken: vi.fn().mockReturnValue('verification-token-digest'),
    generateToken: vi.fn().mockReturnValue('replacement-raw-token'),
    generateSessionSecret: vi.fn().mockReturnValue('raw-session-secret'),
    digestSessionSecret: vi.fn().mockReturnValue('session-secret-digest'),
    now: vi.fn().mockReturnValue(NOW),
    verificationTtlSeconds: 3_600,
    sessionTtlSeconds: 86_400,
    ...overrides,
  }

  return {
    account,
    verification,
    verificationRepository,
    accountRepository,
    sessionRepository,
    emailSender,
    service: createVerificationService(dependencies),
  }
}

describe('verification service', () => {
  it('atomically consumes a valid token, verifies its account, and rotates an authenticated session', async () => {
    const harness = createHarness()

    const result = await harness.service.verifyEmail({ token: 'raw-verification-token' })

    expect(harness.verificationRepository.consumeActive).toHaveBeenCalledWith('verification-token-digest', NOW)
    expect(harness.accountRepository.markVerified).toHaveBeenCalledWith('account-1', NOW)
    expect(harness.sessionRepository.revokeActiveForAccount).toHaveBeenCalledWith('account-1', NOW)
    expect(harness.sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'account-1',
        secretDigest: 'session-secret-digest',
        credentialVersion: 0,
        expiresAt: new Date('2026-07-06T12:00:00.000Z'),
        revokedAt: null,
      }),
    )
    expect(result).toMatchObject({
      account: { verificationStatus: 'verified', verifiedAt: NOW },
      sessionSecret: 'raw-session-secret',
    })
    expect(JSON.stringify(harness.sessionRepository.create.mock.calls)).not.toContain('raw-session-secret')
  })

  it.each([
    ['invalid', null],
    ['expired', null],
    ['already consumed', null],
    ['superseded', null],
  ])('returns the same safe failure for an %s verification token', async (_state, repositoryResult) => {
    const harness = createHarness()
    harness.verificationRepository.consumeActive.mockResolvedValue(repositoryResult)

    await expect(harness.service.verifyEmail({ token: 'unusable-token' })).rejects.toMatchObject({
      code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    })
    expect(harness.accountRepository.markVerified).not.toHaveBeenCalled()
    expect(harness.sessionRepository.create).not.toHaveBeenCalled()
  })

  it('rejects a replay because token consumption is single-use', async () => {
    const harness = createHarness()
    harness.verificationRepository.consumeActive.mockResolvedValueOnce(harness.verification).mockResolvedValueOnce(null)

    await harness.service.verifyEmail({ token: 'raw-verification-token' })
    await expect(harness.service.verifyEmail({ token: 'raw-verification-token' })).rejects.toMatchObject({
      code: ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    })
    expect(harness.accountRepository.markVerified).toHaveBeenCalledOnce()
    expect(harness.sessionRepository.create).toHaveBeenCalledOnce()
  })

  it('supersedes prior links when resending and stores only the replacement digest', async () => {
    const harness = createHarness()

    await harness.service.resendVerification({ accountId: 'account-1' })

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
      email: 'host@example.com',
      token: 'replacement-raw-token',
    })
    expect(JSON.stringify(harness.verificationRepository.create.mock.calls)).not.toContain('replacement-raw-token')
  })

  it('does not issue a replacement for an already verified account', async () => {
    const harness = createHarness()
    harness.accountRepository.findById.mockResolvedValue({
      ...harness.account,
      verificationStatus: 'verified',
      verifiedAt: NOW,
    })

    await expect(harness.service.resendVerification({ accountId: 'account-1' })).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
    })
    expect(harness.verificationRepository.create).not.toHaveBeenCalled()
    expect(harness.emailSender.send).not.toHaveBeenCalled()
  })
})
