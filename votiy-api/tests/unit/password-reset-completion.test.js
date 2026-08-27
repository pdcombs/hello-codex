import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createPasswordResetService } from '../../src/services/password-reset-service.js'

const account = { _id: new ObjectId(), emailNormalized: 'user@example.com', lifecycleStatus: 'completed',
  verificationStatus: 'verified', credentialVersion: 2 }
function service() {
  const reset = { _id: new ObjectId(), accountId: account._id, expiresAt: new Date('2030-01-01T00:15:00Z') }
  const resetRepository = { findActiveByDigest: vi.fn().mockResolvedValue(reset), consumeActive: vi.fn().mockResolvedValue(reset) }
  const accountRepository = { findById: vi.fn().mockResolvedValue(account), updatePassword: vi.fn().mockResolvedValue({ ...account, credentialVersion: 3 }) }
  const sessionRepository = { revokeActiveForAccount: vi.fn() }
  return { resetRepository, accountRepository, sessionRepository, value: createPasswordResetService({ accountRepository,
    resetRepository, sessionRepository, emailSender: {}, digestToken: (x) => `d:${x}`, generateToken: vi.fn(),
    passwordHasher: { hash: vi.fn().mockResolvedValue('new-hash') }, verificationBypassPolicy: { matches: () => false },
    withTransaction: (fn) => fn({}), now: () => new Date('2030-01-01T00:10:00Z'), logger: { info: vi.fn() } }) }
}
describe('password reset completion', () => {
  it('inspects linked email and atomically updates password, version, sessions, token', async () => {
    const x = service(); expect(await x.value.inspect({ token: 'valid-reset-token-123' })).toMatchObject({ email: account.emailNormalized })
    expect(await x.value.reset({ token: 'valid-reset-token-123', password: 'new-password-123', passwordConfirmation: 'new-password-123' })).toMatchObject({ reset: true })
    expect(x.accountRepository.updatePassword).toHaveBeenCalledWith(account._id, 'new-hash', 2,
      new Date('2030-01-01T00:10:00Z'), { session: {} })
    expect(x.sessionRepository.revokeActiveForAccount).toHaveBeenCalled()
  })
  it('rejects mismatch without consuming token', async () => {
    const x = service(); await expect(x.value.reset({ token: 'valid-reset-token-123', password: 'new-password-123',
      passwordConfirmation: 'different-pass-123' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    expect(x.resetRepository.consumeActive).not.toHaveBeenCalled()
  })
  it('rejects invalid token without disclosure', async () => {
    const x = service(); x.resetRepository.findActiveByDigest.mockResolvedValue(null)
    await expect(x.value.inspect({ token: 'invalid-reset-token' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
  })
  it('rejects malformed token and ineligible linked account', async () => {
    const x = service(); await expect(x.value.inspect({ token: 'short' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
    x.accountRepository.findById.mockResolvedValue({ ...account, verificationStatus: 'pending' })
    await expect(x.value.inspect({ token: 'valid-reset-token-123' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
  })
  it('rejects losing atomic consume and account update', async () => {
    const x = service(); x.resetRepository.consumeActive.mockResolvedValue(null)
    await expect(x.value.reset({ token: 'valid-reset-token-123', password: 'new-password-123',
      passwordConfirmation: 'new-password-123' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
    const y = service(); y.accountRepository.updatePassword.mockResolvedValue(null)
    await expect(y.value.reset({ token: 'valid-reset-token-123', password: 'new-password-123',
      passwordConfirmation: 'new-password-123' })).rejects.toMatchObject({ code: 'INVALID_OR_EXPIRED_TOKEN' })
  })
})
