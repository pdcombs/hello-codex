import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { normalizeEmail } from '../domain/security.js'
import { registerInputSchema } from '../domain/validation.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, {
    fieldErrors: error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'input',
      code: issue.code,
      message: issue.message,
    })),
  })
}

export function createRegistrationService({
  accountRepository,
  verificationRepository,
  idempotencyRepository,
  passwordHasher,
  emailSender,
  generateToken,
  digestToken,
  digestRequest,
  verificationTtlSeconds,
  verificationBypassPolicy = { matches: () => false, tokenFor: null },
  now = () => new Date(),
  logger,
}) {
  return Object.freeze({
    async register(rawInput) {
      const parsed = registerInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const input = parsed.data
      const emailNormalized = normalizeEmail(input.email)
      const requestDigest = digestRequest({ displayName: input.displayName, emailNormalized, password: input.password })
      const identity = { scope: emailNormalized, operation: 'register', key: input.idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const account = await accountRepository.findById(prior.resultReference.accountId)
        return {
          account,
          verificationToken: verificationBypassPolicy.matches(emailNormalized)
            ? verificationBypassPolicy.tokenFor(emailNormalized)
            : null,
        }
      }
      if (await accountRepository.findByEmailNormalized(emailNormalized)) {
        logger?.info({ operation: 'account.register', outcome: 'duplicate' }, 'Registration suppressed')
        throw new ApplicationError(ErrorCode.CONFLICT)
      }

      const timestamp = now()
      const passwordHash = await passwordHasher.hash(input.password)
      const bypassVerification = verificationBypassPolicy.matches(emailNormalized)
      let account
      try {
        account = await accountRepository.createPending({
          displayName: input.displayName,
          emailNormalized,
          phoneNormalized: null,
          referredByAccountId: null,
          lifecycleStatus: 'completed',
          passwordHash,
          verificationStatus: 'pending',
          verifiedAt: null,
          credentialVersion: 0,
          now: timestamp,
        })
      } catch (cause) {
        if (cause?.code === 11000) throw new ApplicationError(ErrorCode.CONFLICT, { cause })
        throw cause
      }

      const token = bypassVerification ? verificationBypassPolicy.tokenFor(emailNormalized) : generateToken()
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
          email: emailNormalized,
          verificationToken: token,
        }, 'Verification delivery bypassed for allowlisted account')
      } else {
        await verificationRepository.create(verificationRecord)
        await emailSender.send({ email: emailNormalized, token })
        logger?.info({ operation: 'email.verification.send', outcome: 'success' }, 'Verification email sent')
      }
      logger?.info({ operation: 'account.register', outcome: 'success' }, 'Account registration completed')
      await idempotencyRepository.create({
        ...identity,
        requestDigest,
        resultReference: { accountId: account._id },
        expiresAt: new Date(timestamp.getTime() + 86_400_000),
        createdAt: timestamp,
      })
      return { account, verificationToken: bypassVerification ? token : null }
    },
  })
}
