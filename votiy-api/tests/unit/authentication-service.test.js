import { describe, expect, it, vi } from 'vitest'
import { ErrorCode } from '../../src/domain/errors.js'
import { createAuthenticationService } from '../../src/services/authentication-service.js'

const NOW = new Date('2026-07-06T12:00:00Z')
function harness(
  account = {
    _id: 'a1',
    emailNormalized: 'host@example.com',
    passwordHash: 'hash',
    verificationStatus: 'verified',
    credentialVersion: 0,
  },
) {
  const accountRepository = {
    findByEmailNormalized: vi.fn().mockResolvedValue(account),
    findById: vi.fn().mockResolvedValue(account),
  }
  const sessionRepository = {
    revokeActiveForAccount: vi.fn(),
    create: vi.fn(),
    revokeByDigest: vi.fn(),
    findActiveByDigest: vi.fn(),
    touchLastSeen: vi.fn(),
  }
  const passwordHasher = { verify: vi.fn().mockResolvedValue(true) }
  const service = createAuthenticationService({
    accountRepository,
    sessionRepository,
    passwordHasher,
    digestSessionSecret: vi.fn((v) => `digest:${v}`),
    generateSessionSecret: () => 'secret',
    sessionTtlSeconds: 3600,
    now: () => NOW,
  })
  return { service, accountRepository, sessionRepository, passwordHasher }
}
describe('authentication service', () => {
  it('verifies credentials, rotates sessions, and returns opaque secret', async () => {
    const h = harness()
    const result = await h.service.signIn({ email: ' HOST@example.com ', password: 'password' })
    expect(h.passwordHasher.verify).toHaveBeenCalledWith('hash', 'password')
    expect(h.sessionRepository.revokeActiveForAccount).toHaveBeenCalledWith('a1', NOW)
    expect(h.sessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({ secretDigest: 'digest:secret' }))
    expect(result.sessionSecret).toBe('secret')
  })
  it.each([null, { _id: 'a1', passwordHash: 'hash', verificationStatus: 'verified', credentialVersion: 0 }])(
    'uses same safe failure for missing or bad credentials',
    async (account) => {
      const h = harness(account)
      if (account) h.passwordHasher.verify.mockResolvedValue(false)
      await expect(h.service.signIn({ email: 'x@example.com', password: 'bad' })).rejects.toMatchObject({
        code: ErrorCode.INVALID_CREDENTIALS,
      })
    },
  )
  it('denies unverified accounts', async () => {
    const h = harness({ _id: 'a1', passwordHash: 'hash', verificationStatus: 'pending', credentialVersion: 0 })
    await expect(h.service.signIn({ email: 'x@example.com', password: 'password' })).rejects.toMatchObject({
      code: ErrorCode.EMAIL_NOT_VERIFIED,
    })
  })
  it('recognizes active sessions, throttles last-seen, and rejects credential mismatch', async () => {
    const h = harness()
    h.sessionRepository.findActiveByDigest.mockResolvedValue({
      _id: 's1',
      accountId: 'a1',
      credentialVersion: 0,
      lastSeenAt: new Date(0),
    })
    await expect(h.service.viewer({ secret: 'raw' })).resolves.toMatchObject({ account: { _id: 'a1' } })
    expect(h.sessionRepository.touchLastSeen).toHaveBeenCalled()
    h.accountRepository.findById.mockResolvedValue({ credentialVersion: 2 })
    await expect(h.service.viewer({ secret: 'raw' })).rejects.toMatchObject({ code: ErrorCode.AUTHENTICATION_REQUIRED })
  })
  it('revokes sign-out secret and succeeds without one', async () => {
    const h = harness()
    await h.service.signOut({ secret: 'raw' })
    await h.service.signOut({})
    expect(h.sessionRepository.revokeByDigest).toHaveBeenCalledWith('digest:raw', NOW)
  })
})
