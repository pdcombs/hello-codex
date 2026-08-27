import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { createPasswordResetService } from '../../src/services/password-reset-service.js'

const account = { _id: new ObjectId(), emailNormalized: 'user@example.com', lifecycleStatus: 'completed',
  verificationStatus: 'verified', credentialVersion: 2 }
function setup({ found = account, bypass = false, sendError = null } = {}) {
  const resetRepository = { supersedeActiveForAccount: vi.fn(), create: vi.fn().mockResolvedValue({ _id: new ObjectId() }),
    markDeliveryFailed: vi.fn() }
  const emailSender = { sendPasswordReset: sendError ? vi.fn().mockRejectedValue(sendError) : vi.fn() }
  const service = createPasswordResetService({ accountRepository: { findByEmailNormalized: vi.fn().mockResolvedValue(found) },
    resetRepository, sessionRepository: {}, emailSender, digestToken: (x) => `digest:${x}`,
    generateToken: () => 'unique-reset-token-123456789', passwordHasher: {},
    verificationBypassPolicy: { matches: () => bypass }, withTransaction: (operation) => operation({ testSession: true }),
    now: () => new Date('2030-01-01T00:00:00Z'), logger: { info: vi.fn(), error: vi.fn() } })
  return { service, resetRepository, emailSender }
}

describe('password reset request', () => {
  it('emails eligible account and stores unique digest with exact expiry source time', async () => {
    const { service, resetRepository, emailSender } = setup()
    const result = await service.request({ email: ' User@Example.com ' })
    expect(result).toMatchObject({ accepted: true, bypassToken: null, deliveryPath: 'email' })
    expect(resetRepository.create).toHaveBeenCalledWith(expect.objectContaining({ accountId: account._id,
      tokenDigest: 'digest:unique-reset-token-123456789', deliveryPath: 'email', now: new Date('2030-01-01T00:00:00Z') }),
    { session: { testSession: true } })
    expect(emailSender.sendPasswordReset).toHaveBeenCalledWith({ email: 'user@example.com', token: 'unique-reset-token-123456789' })
  })
  it('is neutral for unknown accounts and sends nothing', async () => {
    const { service, resetRepository, emailSender } = setup({ found: null })
    expect(await service.request({ email: 'unknown@example.com' })).toMatchObject({ accepted: true, bypassToken: null })
    expect(resetRepository.create).not.toHaveBeenCalled(); expect(emailSender.sendPasswordReset).not.toHaveBeenCalled()
  })
  it('marks failed delivery unusable while remaining neutral', async () => {
    const { service, resetRepository } = setup({ sendError: new Error('mail down') })
    expect(await service.request({ email: account.emailNormalized })).toMatchObject({ accepted: true, deliveryPath: 'email_failed' })
    expect(resetRepository.markDeliveryFailed).toHaveBeenCalled()
  })
  it('returns direct unique token and sends no email for bypass', async () => {
    const { service, emailSender } = setup({ bypass: true })
    expect(await service.request({ email: account.emailNormalized })).toMatchObject({ bypassToken: 'unique-reset-token-123456789', deliveryPath: 'bypass' })
    expect(emailSender.sendPasswordReset).not.toHaveBeenCalled()
  })
  it('rejects malformed email and treats pending account as neutral', async () => {
    const x = setup(); await expect(x.service.request({ email: 'bad' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' })
    const pending = setup({ found: { ...account, verificationStatus: 'pending' } })
    expect(await pending.service.request({ email: account.emailNormalized })).toMatchObject({ accountId: null })
  })
})
