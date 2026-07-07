import { ApplicationError, ErrorCode } from '../domain/errors.js'

export function createVerificationService({
  accountRepository,
  verificationRepository,
  sessionRepository,
  emailSender,
  digestToken,
  generateToken,
  generateSessionSecret,
  digestSessionSecret,
  verificationTtlSeconds,
  sessionTtlSeconds,
  now = () => new Date(),
  logger,
}) {
  return Object.freeze({
    async verifyEmail({ token }) {
      const timestamp = now()
      const verification = token && (await verificationRepository.consumeActive(digestToken(token), timestamp))
      if (!verification) {
        logger?.info({ operation: 'account.verify', outcome: 'denied' }, 'Verification denied')
        throw new ApplicationError(ErrorCode.INVALID_OR_EXPIRED_TOKEN)
      }
      const currentAccount = await accountRepository.findById(verification.accountId)
      const account = await accountRepository.markVerified(verification.accountId, timestamp)
      if (!account) throw new ApplicationError(ErrorCode.INVALID_OR_EXPIRED_TOKEN)
      await sessionRepository.revokeActiveForAccount(account._id, timestamp)
      const sessionSecret = generateSessionSecret()
      await sessionRepository.create({
        accountId: account._id,
        secretDigest: digestSessionSecret(sessionSecret),
        credentialVersion: currentAccount.credentialVersion,
        expiresAt: new Date(timestamp.getTime() + sessionTtlSeconds * 1000),
        revokedAt: null,
        now: timestamp,
      })
      logger?.info({ operation: 'account.verify', outcome: 'success' }, 'Account verified')
      return { account, sessionSecret }
    },
    async resendVerification({ accountId }) {
      const account = await accountRepository.findById(accountId)
      if (!account) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      if (account.verificationStatus === 'verified') throw new ApplicationError(ErrorCode.CONFLICT)
      const timestamp = now()
      const token = generateToken()
      await verificationRepository.supersedeActiveForAccount(account._id, timestamp)
      await verificationRepository.create({
        accountId: account._id,
        tokenDigest: digestToken(token),
        expiresAt: new Date(timestamp.getTime() + verificationTtlSeconds * 1000),
        consumedAt: null,
        now: timestamp,
      })
      await emailSender.send({ email: account.emailNormalized, token })
      logger?.info({ operation: 'email.verification.resend', outcome: 'success' }, 'Verification email resent')
      return { account }
    },
  })
}
