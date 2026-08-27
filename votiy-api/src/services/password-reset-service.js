import { ApplicationError, ErrorCode } from '../domain/errors.js'
import { normalizeEmail } from '../domain/security.js'
import { inspectPasswordResetInputSchema, requestPasswordResetInputSchema, resetPasswordInputSchema } from '../domain/validation.js'

const invalid = () => new ApplicationError(ErrorCode.INVALID_OR_EXPIRED_TOKEN)
function validation(error) {
  return new ApplicationError(ErrorCode.VALIDATION_FAILED, { fieldErrors: error.issues.map((issue) => ({
    field: String(issue.path[0] ?? 'input'), code: issue.code, message: issue.message,
  })) })
}

export function createPasswordResetService({ accountRepository, resetRepository, sessionRepository, emailSender,
  digestToken, generateToken, passwordHasher, verificationBypassPolicy, withTransaction, now = () => new Date(), logger }) {
  async function active(rawInput) {
    const parsed = inspectPasswordResetInputSchema.safeParse(rawInput)
    if (!parsed.success) throw invalid()
    const timestamp = now()
    const reset = await resetRepository.findActiveByDigest(digestToken(parsed.data.token), timestamp)
    if (!reset) throw invalid()
    const account = await accountRepository.findById(reset.accountId)
    if (!account || account.lifecycleStatus !== 'completed' || account.verificationStatus !== 'verified') throw invalid()
    return { reset, account, timestamp }
  }

  return Object.freeze({
    async request(rawInput, { correlationId = 'password-reset-request' } = {}) {
      const parsed = requestPasswordResetInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validation(parsed.error)
      const startedAt = process.hrtime.bigint(); const email = normalizeEmail(parsed.data.email)
      const account = await accountRepository.findByEmailNormalized(email)
      const eligible = account?.lifecycleStatus === 'completed' && account.verificationStatus === 'verified'
      if (!eligible) {
        digestToken(generateToken())
        logger?.info({ operation: 'password_reset.request', outcome: 'accepted', correlationId,
          durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000 }, 'Password reset request accepted')
        return { accepted: true, bypassToken: null, accountId: null, deliveryPath: null }
      }
      const timestamp = now(); const token = generateToken()
      const bypass = verificationBypassPolicy.matches(account.emailNormalized)
      const reset = await withTransaction(async (session) => {
        await resetRepository.supersedeActiveForAccount(account._id, timestamp, { session })
        return resetRepository.create({ accountId: account._id, tokenDigest: digestToken(token),
          deliveryPath: bypass ? 'bypass' : 'email', now: timestamp }, { session })
      })
      if (!bypass) {
        try { await emailSender.sendPasswordReset({ email: account.emailNormalized, token }) }
        catch (cause) {
          await resetRepository.markDeliveryFailed(reset._id, now())
          logger?.error?.({ operation: 'password_reset.email', outcome: 'failure', correlationId,
            errorCode: ErrorCode.SERVICE_UNAVAILABLE }, 'Password reset email failed')
          return { accepted: true, bypassToken: null, accountId: account._id, deliveryPath: 'email_failed' }
        }
      }
      logger?.info({ operation: 'password_reset.request', outcome: 'success', correlationId,
        deliveryPath: bypass ? 'bypass' : 'email', durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000 },
      'Password reset request completed')
      return { accepted: true, bypassToken: bypass ? token : null, accountId: account._id,
        deliveryPath: bypass ? 'bypass' : 'email' }
    },
    async inspect(rawInput) {
      const { reset, account } = await active(rawInput)
      return { email: account.emailNormalized, expiresAt: reset.expiresAt }
    },
    async reset(rawInput, { correlationId = 'password-reset-complete' } = {}) {
      const parsed = resetPasswordInputSchema.safeParse(rawInput)
      if (!parsed.success) throw validation(parsed.error)
      const { reset, account, timestamp } = await active({ token: parsed.data.token })
      const passwordHash = await passwordHasher.hash(parsed.data.password)
      const result = await withTransaction(async (session) => {
        const consumed = await resetRepository.consumeActive(reset._id, timestamp, { session })
        if (!consumed) throw invalid()
        const updated = await accountRepository.updatePassword(account._id, passwordHash,
          account.credentialVersion, timestamp, { session })
        if (!updated) throw invalid()
        await sessionRepository.revokeActiveForAccount(account._id, timestamp, { session })
        return updated
      })
      logger?.info({ operation: 'password_reset.complete', outcome: 'success', correlationId }, 'Password reset completed')
      return { reset: true, accountId: result._id }
    },
  })
}
