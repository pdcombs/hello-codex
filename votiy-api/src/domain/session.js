import { ObjectId } from 'mongodb'
import { stringifySetCookie } from 'cookie'

export function createSessionDocument({ accountId, secretDigest, credentialVersion, expiresAt, now = new Date() }) {
  if (!secretDigest || !(expiresAt instanceof Date) || expiresAt <= now) throw new TypeError('Invalid session')
  return Object.freeze({
    _id: new ObjectId(),
    accountId: accountId instanceof ObjectId ? accountId : new ObjectId(accountId),
    secretDigest,
    credentialVersion,
    lastSeenAt: now,
    expiresAt,
    revokedAt: null,
    createdAt: now,
    schemaVersion: 1,
  })
}

export function sessionCookie(secret, { name, isProduction, maxAge }) {
  return stringifySetCookie({
    name,
    value: secret,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function expiredSessionCookie({ name, isProduction }) {
  return stringifySetCookie({
    name,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
