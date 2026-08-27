import { ObjectId } from 'mongodb'

export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000

export function createPasswordResetRequest({ accountId, tokenDigest, deliveryPath, now = new Date() }) {
  if (!tokenDigest || !['email', 'bypass'].includes(deliveryPath)) throw new TypeError('Invalid password reset request')
  return Object.freeze({
    _id: new ObjectId(),
    accountId: accountId instanceof ObjectId ? accountId : new ObjectId(accountId),
    tokenDigest, deliveryPath, status: 'active',
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
    consumedAt: null, supersededAt: null, deliveryFailedAt: null,
    createdAt: now, updatedAt: now, schemaVersion: 1,
  })
}

export function passwordResetIsActive(request, now = new Date()) {
  return request?.status === 'active' && request.expiresAt > now && request.consumedAt == null
    && request.supersededAt == null && request.deliveryFailedAt == null
}
