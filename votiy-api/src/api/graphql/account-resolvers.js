import { publicAccount } from '../../domain/account.js'
import { ApplicationError, ErrorCode, toClientError } from '../../domain/errors.js'

const successAccount = (account, verificationToken = null) => ({
  __typename: 'AccountSuccess',
  account: publicAccount(account),
  verificationToken,
})
const successSession = (account) => ({
  __typename: 'SessionSuccess',
  session: { account: publicAccount(account) },
})
const failure = (error, correlationId) => ({ __typename: 'OperationError', ...toClientError(error, correlationId) })

export function createAccountResolvers({ registrationService, verificationService, sessionService,
  passwordResetService = null, auditRepository }) {
  return Object.freeze({
    async register({ input }, context) {
      try {
        const { account, verificationToken } = await registrationService.register(input)
        await auditRepository?.append({
          name: 'account.registered',
          actorAccountId: null,
          subjectType: 'account',
          subjectId: String(account._id ?? account.id),
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { lifecycleStatus: 'completed' },
        })
        return successAccount(account, verificationToken)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async verifyEmail({ input }, context) {
      try {
        const { account, sessionSecret } = await verificationService.verifyEmail(input)
        context.setSessionCookie(sessionSecret)
        await auditRepository?.append({
          name: 'account.verified',
          actorAccountId: account._id,
          subjectType: 'account',
          subjectId: String(account._id ?? account.id),
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { verificationStatus: 'verified' },
        })
        return successSession(account)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async resendVerification(_args, context) {
      try {
        if (!context.session) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
        const viewer = context.session.accountId
          ? { account: { _id: context.session.accountId } }
          : await sessionService.viewer(context.session)
        const { account, verificationToken } = await verificationService.resendVerification({ accountId: viewer.account._id })
        return successAccount(account, verificationToken)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async viewer(_args, context) {
      try {
        const { account } = await sessionService.viewer(context.session)
        return successSession(account)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async requestPasswordReset({ input }, context) {
      try {
        const result = await passwordResetService.request(input, { correlationId: context.correlationId })
        await auditRepository?.append({ name: result.deliveryPath === 'bypass' ? 'password_reset.bypassed'
          : result.deliveryPath === 'email_failed' ? 'password_reset.email_failed' : 'password_reset.requested',
        actorAccountId: null, subjectType: 'account', subjectId: String(result.accountId ?? 'undisclosed'),
        outcome: result.deliveryPath === 'email_failed' ? 'failure' : 'success', correlationId: context.correlationId,
        metadata: result.deliveryPath ? { deliveryPath: result.deliveryPath } : {} })
        return { __typename: 'PasswordResetRequestSuccess', accepted: true, bypassToken: result.bypassToken }
      } catch (error) { return failure(error, context.correlationId) }
    },
    async inspectPasswordReset({ input }, context) {
      try {
        const result = await passwordResetService.inspect(input)
        return { __typename: 'PasswordResetInspectionSuccess', ...result }
      } catch (error) { return failure(error, context.correlationId) }
    },
    async resetPassword({ input }, context) {
      try {
        const result = await passwordResetService.reset(input, { correlationId: context.correlationId })
        context.clearSessionCookie?.()
        await auditRepository?.append({ name: 'password_reset.completed', actorAccountId: null,
          subjectType: 'account', subjectId: String(result.accountId), outcome: 'success',
          correlationId: context.correlationId, metadata: {} })
        return { __typename: 'PasswordResetSuccess', reset: true }
      } catch (error) {
        await auditRepository?.append({ name: 'password_reset.denied', actorAccountId: null,
          subjectType: 'password_reset', subjectId: 'undisclosed', outcome: 'denied',
          correlationId: context.correlationId, metadata: { errorCode: error.code ?? ErrorCode.SERVICE_UNAVAILABLE } })
        return failure(error, context.correlationId)
      }
    },
  })
}
