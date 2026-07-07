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
  verificationBypassPolicy = { matches: () => false, tokenFor: null },
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
      const bypassVerification = verificationBypassPolicy.matches(account.emailNormalized)
      const token = bypassVerification ? verificationBypassPolicy.tokenFor(account.emailNormalized) : generateToken()
      await verificationRepository.supersedeActiveForAccount(account._id, timestamp)
      const verificationRecord = {
        accountId: account._id,
        tokenDigest: digestToken(token),
        expiresAt: new Date(timestamp.getTime() + verificationTtlSeconds * 1000),
        consumedAt: null,
        now: timestamp,
      }
      if (bypassVerification) {
        await verificationRepository.createOrRefreshReusable(verificationRecord)
        logger?.info({
          operation: 'email.verification.bypass',
          outcome: 'success',
          email: account.emailNormalized,
          verificationToken: token,
        }, 'Verification resend bypassed for allowlisted account')
      } else {
        await verificationRepository.create(verificationRecord)
        await emailSender.send({ email: account.emailNormalized, token })
        logger?.info({ operation: 'email.verification.resend', outcome: 'success' }, 'Verification email resent')
      }
      return { account, verificationToken: bypassVerification ? token : null }
    },
  })
}
