import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { assertAccount, createPendingAccount, publicAccount } from '../../src/domain/account.js'
import { createEmailVerification } from '../../src/domain/email-verification.js'
import { createSessionDocument, expiredSessionCookie, sessionCookie } from '../../src/domain/session.js'

const NOW = new Date('2026-07-05T12:00:00.000Z')

describe('account documents', () => {
  it('creates a completed pending account with null self-registration referral metadata', () => {
    const account = createPendingAccount({
      emailNormalized: 'host@example.com',
      passwordHash: 'argon2id-hash',
      now: NOW,
    })
    expect(account).toMatchObject({
      emailNormalized: 'host@example.com',
      phoneNormalized: null,
      referredByAccountId: null,
      lifecycleStatus: 'completed',
      verificationStatus: 'pending',
      verifiedAt: null,
      credentialVersion: 0,
      createdAt: NOW,
      updatedAt: NOW,
      schemaVersion: 1,
    })
    expect(Object.isFrozen(account)).toBe(true)
  })

  it('rejects malformed, credential-less completed, and timestamp-less verified accounts', () => {
    expect(() => assertAccount({})).toThrow('Invalid account document')
    expect(() =>
      assertAccount({
        _id: new ObjectId(),
        lifecycleStatus: 'completed',
        verificationStatus: 'pending',
        emailNormalized: null,
        passwordHash: null,
      }),
    ).toThrow('require email and password')
    expect(() =>
      assertAccount({
        _id: new ObjectId(),
        lifecycleStatus: 'completed',
        verificationStatus: 'verified',
        emailNormalized: 'host@example.com',
        passwordHash: 'hash',
        verifiedAt: null,
      }),
    ).toThrow('require verifiedAt')
  })

  it('accepts a verified account and maps stored and already-public shapes safely', () => {
    const stored = assertAccount({
      _id: new ObjectId(),
      lifecycleStatus: 'completed',
      verificationStatus: 'verified',
      emailNormalized: 'host@example.com',
      passwordHash: 'hash',
      verifiedAt: NOW,
      createdAt: NOW,
    })
    expect(publicAccount(stored)).toEqual({
      id: String(stored._id),
      email: 'host@example.com',
      isVerified: true,
      createdAt: NOW,
    })
    expect(publicAccount({ id: 'public-1', email: 'public@example.com', isVerified: false, createdAt: NOW })).toEqual({
      id: 'public-1',
      email: 'public@example.com',
      isVerified: false,
      createdAt: NOW,
    })
  })
})

describe('verification and session documents', () => {
  it('creates an expiring verification from either string or ObjectId account IDs', () => {
    const expiresAt = new Date('2026-07-05T13:00:00.000Z')
    const first = createEmailVerification({
      accountId: new ObjectId(),
      tokenDigest: 'digest',
      expiresAt,
      now: NOW,
    })
    const second = createEmailVerification({
      accountId: String(first.accountId),
      tokenDigest: 'digest-2',
      expiresAt,
      now: NOW,
    })
    expect(first).toMatchObject({ expiresAt, consumedAt: null, createdAt: NOW, schemaVersion: 1 })
    expect(second.accountId).toEqual(first.accountId)
  })

  it.each([
    { tokenDigest: '', expiresAt: new Date('2026-07-05T13:00:00.000Z') },
    { tokenDigest: 'digest', expiresAt: new Date('2026-07-05T11:00:00.000Z') },
  ])('rejects an unusable verification document', (input) => {
    expect(() => createEmailVerification({ accountId: new ObjectId(), now: NOW, ...input })).toThrow(
      'Invalid email verification',
    )
  })

  it('creates an opaque active session and converts string account IDs', () => {
    const accountId = new ObjectId()
    const session = createSessionDocument({
      accountId: String(accountId),
      secretDigest: 'session-digest',
      credentialVersion: 2,
      expiresAt: new Date('2026-07-06T12:00:00.000Z'),
      now: NOW,
    })
    expect(session).toMatchObject({
      accountId,
      secretDigest: 'session-digest',
      credentialVersion: 2,
      lastSeenAt: NOW,
      revokedAt: null,
      createdAt: NOW,
      schemaVersion: 1,
    })
  })

  it.each([
    { secretDigest: '', expiresAt: new Date('2026-07-06T12:00:00.000Z') },
    { secretDigest: 'digest', expiresAt: new Date('2026-07-04T12:00:00.000Z') },
  ])('rejects an unusable session document', (input) => {
    expect(() =>
      createSessionDocument({
        accountId: new ObjectId(),
        credentialVersion: 0,
        now: NOW,
        ...input,
      }),
    ).toThrow('Invalid session')
  })

  it('serializes secure production, local, and clearing cookies', () => {
    const production = sessionCookie('secret', { name: 'votiy_session', isProduction: true, maxAge: 60 })
    const local = sessionCookie('secret', { name: 'votiy_session', isProduction: false, maxAge: 60 })
    const expired = expiredSessionCookie({ name: 'votiy_session', isProduction: true })
    expect(production).toContain('HttpOnly')
    expect(production).toContain('Secure')
    expect(production).toContain('SameSite=Lax')
    expect(local).not.toContain('Secure')
    expect(expired).toContain('Max-Age=0')
  })
})
