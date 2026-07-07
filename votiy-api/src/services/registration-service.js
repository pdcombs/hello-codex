import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { normalizeEmail } from '../domain/security.js'
import { registerInputSchema } from '../domain/validation.js'

function validationError(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, {
    fieldErrors: error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'input'),
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
  now = () => new Date(),
  logger,
}) {
  return Object.freeze({
    async register(rawInput) {
      const parsed = registerInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validationError(parsed.error)
      const input = parsed.data
      const emailNormalized = normalizeEmail(input.email)
      const requestDigest = digestRequest({ emailNormalized, password: input.password })
      const identity = { scope: emailNormalized, operation: 'register', key: input.idempotencyKey }
      const prior = await idempotencyRepository.find(identity)
      if (prior) {
        if (prior.requestDigest !== requestDigest) throw new ApplicationError(ErrorCode.CONFLICT)
        const account = await accountRepository.findById(prior.resultReference.accountId)
        return { account }
      }
      if (await accountRepository.findByEmailNormalized(emailNormalized)) {
        logger?.info({ operation: 'account.register', outcome: 'duplicate' }, 'Registration suppressed')
        throw new ApplicationError(ErrorCode.CONFLICT)
      }

      const timestamp = now()
      const passwordHash = await passwordHasher.hash(input.password)
      let account
      try {
        account = await accountRepository.createPending({
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

      const token = generateToken()
      await verificationRepository.supersedeActiveForAccount(account._id, timestamp)
      await verificationRepository.create({
        accountId: account._id,
        tokenDigest: digestToken(token),
        expiresAt: new Date(timestamp.getTime() + verificationTtlSeconds * 1000),
        consumedAt: null,
        now: timestamp,
      })
      await emailSender.send({ email: emailNormalized, token })
      logger?.info({ operation: 'account.register', outcome: 'success' }, 'Account registration completed')
      logger?.info({ operation: 'email.verification.send', outcome: 'success' }, 'Verification email sent')
      await idempotencyRepository.create({
        ...identity,
        requestDigest,
        resultReference: { accountId: account._id },
        expiresAt: new Date(timestamp.getTime() + 86_400_000),
        createdAt: timestamp,
      })
      return { account }
    },
  })
}
