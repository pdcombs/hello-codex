import { ObjectId } from 'mongodb'

export const resetNow = new Date('2030-01-01T00:00:00.000Z')
export const resetExpiresAt = new Date('2030-01-01T00:15:00.000Z')
export const resetToken = 'reset-token-for-tests-with-enough-entropy-012'
export const resetAccount = Object.freeze({ _id: new ObjectId('64b000000000000000000012'),
  emailNormalized: 'reset@example.test', lifecycleStatus: 'completed', verificationStatus: 'verified',
  credentialVersion: 1 })
