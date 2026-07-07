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

export function createAccountResolvers({ registrationService, verificationService, sessionService, auditRepository }) {
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
  })
}
