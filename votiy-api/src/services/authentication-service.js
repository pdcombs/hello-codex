import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { normalizeEmail } from '../domain/security.js'
import { signInInputSchema } from '../domain/validation.js'

const denied = () => new ApplicationError(ErrorCode.INVALID_CREDENTIALS)

export function createAuthenticationService({
  accountRepository,
  sessionRepository,
  passwordHasher,
  digestSessionSecret,
  generateSessionSecret,
  sessionTtlSeconds,
  now = () => new Date(),
  logger,
  dummyPasswordHash = '$argon2id$v=19$m=65536,t=3,p=4$ZHVtbXlkdW1teWR1bW15ZA$ZHVtbXlkdW1teWR1bW15ZHVtbXlkdW1teWR1bW15ZA',
}) {
  return Object.freeze({
    async viewer(sessionInput) {
      if (!sessionInput?.secret) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const timestamp = now()
      const session = await sessionRepository.findActiveByDigest(digestSessionSecret(sessionInput.secret), timestamp)
      const account = session && (await accountRepository.findById(session.accountId))
      if (!account || account.credentialVersion !== session.credentialVersion) {
        logger?.info({ operation: 'session.viewer', outcome: 'expired' }, 'Session denied')
        throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      }
      await sessionRepository.touchLastSeen?.(session._id, session.lastSeenAt, timestamp)
      return { account }
    },
    async signIn(rawInput) {
      const parsed = signInInputSchema.safeParse(rawInput)
      if (!parsed.success) throw denied()
      const emailNormalized = normalizeEmail(parsed.data.email)
      const account = await accountRepository.findByEmailNormalized(emailNormalized)
      let valid = false
      try {
        valid = await passwordHasher.verify(account?.passwordHash ?? dummyPasswordHash, parsed.data.password)
      } catch {
        valid = false
      }
      if (!account || !valid) {
        logger?.info({ operation: 'authentication.sign_in', outcome: 'denied' }, 'Sign-in denied')
        throw denied()
      }
      if (account.verificationStatus !== 'verified') throw new ApplicationError(ErrorCode.EMAIL_NOT_VERIFIED)
      const timestamp = now()
      await sessionRepository.revokeActiveForAccount(account._id, timestamp)
      const sessionSecret = generateSessionSecret()
      await sessionRepository.create({
        accountId: account._id,
        secretDigest: digestSessionSecret(sessionSecret),
        credentialVersion: account.credentialVersion,
        expiresAt: new Date(timestamp.getTime() + sessionTtlSeconds * 1000),
        now: timestamp,
      })
      logger?.info({ operation: 'authentication.sign_in', outcome: 'success' }, 'Sign-in completed')
      return { account, sessionSecret }
    },
    async signOut({ secret }) {
      if (secret) await sessionRepository.revokeByDigest(digestSessionSecret(secret), now())
      logger?.info({ operation: 'authentication.sign_out', outcome: 'success' }, 'Sign-out completed')
      return { signedOut: true }
    },
  })
}
