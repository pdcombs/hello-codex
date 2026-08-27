import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { createPasswordResetRequest, passwordResetIsActive } from '../../src/domain/password-reset.js'

describe('password reset domain', () => {
  it('creates exact 15-minute active record and normalizes account id', () => {
    const now = new Date('2030-01-01T00:00:00Z'); const accountId = new ObjectId()
    const record = createPasswordResetRequest({ accountId: String(accountId), tokenDigest: 'digest', deliveryPath: 'email', now })
    expect(record.accountId).toEqual(accountId); expect(record.expiresAt.getTime() - now.getTime()).toBe(900_000)
    expect(passwordResetIsActive(record, new Date('2030-01-01T00:14:59Z'))).toBe(true)
    expect(passwordResetIsActive(record, record.expiresAt)).toBe(false)
  })
  it('fails closed for invalid records and every terminal marker', () => {
    expect(() => createPasswordResetRequest({ accountId: new ObjectId(), tokenDigest: '', deliveryPath: 'email' })).toThrow()
    expect(() => createPasswordResetRequest({ accountId: new ObjectId(), tokenDigest: 'x', deliveryPath: 'other' })).toThrow()
    const base = createPasswordResetRequest({ accountId: new ObjectId(), tokenDigest: 'x', deliveryPath: 'bypass', now: new Date() })
    expect(passwordResetIsActive(null)).toBe(false)
    for (const patch of [{ status: 'consumed' }, { consumedAt: new Date() }, { supersededAt: new Date() },
      { deliveryFailedAt: new Date() }]) expect(passwordResetIsActive({ ...base, ...patch })).toBe(false)
  })
})
