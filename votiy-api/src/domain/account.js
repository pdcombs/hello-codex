import { ObjectId } from 'mongodb'

const LIFECYCLES = new Set(['provisional', 'completed'])
const VERIFICATION_STATES = new Set(['pending', 'verified'])

export function deriveDisplayName({ emailNormalized = null, phoneOnlyPosition = null }) {
  if (emailNormalized) {
    const prefix = emailNormalized.split('@', 1)[0].trim()
    if (prefix) return prefix.slice(0, 100)
  }
  if (Number.isInteger(phoneOnlyPosition) && phoneOnlyPosition > 0) return `Participant ${phoneOnlyPosition}`
  throw new TypeError('Display name source is required')
}

export function withAccountVersion2(account, displayName) {
  const trimmed = typeof displayName === 'string' ? displayName.trim() : ''
  if (!trimmed || trimmed.length > 100) throw new TypeError('Invalid display name')
  return assertAccount({ ...account, displayName: trimmed, schemaVersion: 2 })
}

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

export function createProvisionalAccount({
  emailNormalized = null,
  phoneNormalized = null,
  referredByAccountId,
  now = new Date(),
}) {
  const document = {
    _id: new ObjectId(),
    emailNormalized,
    phoneNormalized,
    referredByAccountId: referredByAccountId instanceof ObjectId ? referredByAccountId : new ObjectId(referredByAccountId),
    lifecycleStatus: 'provisional',
    passwordHash: null,
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
  if (account.lifecycleStatus === 'provisional' && !account.emailNormalized && !account.phoneNormalized) {
    throw new TypeError('Provisional accounts require an email or phone identifier')
  }
  if (account.verificationStatus === 'verified' && !(account.verifiedAt instanceof Date)) {
    throw new TypeError('Verified accounts require verifiedAt')
  }
  if (account.schemaVersion === 2 && (!account.displayName?.trim() || account.displayName.length > 100)) {
    throw new TypeError('Version 2 accounts require displayName')
  }
  return Object.freeze(account)
}

export function publicAccount(account) {
  return Object.freeze({
    id: String(account._id ?? account.id),
    ...(account.displayName ? { displayName: account.displayName } : {}),
    email: account.emailNormalized ?? account.email,
    isVerified: account.verificationStatus ? account.verificationStatus === 'verified' : account.isVerified,
    createdAt: account.createdAt,
  })
}
