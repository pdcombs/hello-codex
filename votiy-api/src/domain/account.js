import { ObjectId } from 'mongodb'

const LIFECYCLES = new Set(['provisional', 'completed'])
const VERIFICATION_STATES = new Set(['pending', 'verified'])

export function createPendingAccount({ emailNormalized, passwordHash, referredByAccountId = null, now = new Date() }) {
  const document = {
    _id: new ObjectId(),
    emailNormalized,
    phoneNormalized: null,
    referredByAccountId,
    lifecycleStatus: 'completed',
    passwordHash,
    verificationStatus: 'pending',
    verifiedAt: null,
    credentialVersion: 0,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  }
  return assertAccount(document)
}

export function assertAccount(account) {
  if (
    !(account?._id instanceof ObjectId) ||
    !LIFECYCLES.has(account.lifecycleStatus) ||
    !VERIFICATION_STATES.has(account.verificationStatus)
  )
    throw new TypeError('Invalid account document')
  if (account.lifecycleStatus === 'completed' && (!account.emailNormalized || !account.passwordHash)) {
    throw new TypeError('Completed accounts require email and password credentials')
  }
  if (account.verificationStatus === 'verified' && !(account.verifiedAt instanceof Date)) {
    throw new TypeError('Verified accounts require verifiedAt')
  }
  return Object.freeze(account)
}

export function publicAccount(account) {
  return Object.freeze({
    id: String(account._id ?? account.id),
    email: account.emailNormalized ?? account.email,
    isVerified: account.verificationStatus ? account.verificationStatus === 'verified' : account.isVerified,
    createdAt: account.createdAt,
  })
}
