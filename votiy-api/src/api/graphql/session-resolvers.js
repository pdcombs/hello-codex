import { publicAccount } from '../../domain/account.js'
import { toClientError } from '../../domain/errors.js'

const failure = (error, correlationId) => ({ __typename: 'OperationError', ...toClientError(error, correlationId) })

export function createSessionResolvers({ authenticationService, auditRepository }) {
  return Object.freeze({
    async signIn({ input }, context) {
      try {
        const { account, sessionSecret } = await authenticationService.signIn(input)
        context.setSessionCookie(sessionSecret)
        await auditRepository?.append({
          name: 'authentication.signed_in',
          actorAccountId: account._id,
          subjectType: 'account',
          subjectId: String(account._id),
          outcome: 'success',
          correlationId: context.correlationId,
        })
        return { __typename: 'SessionSuccess', session: { account: publicAccount(account) } }
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async signOut(_args, context) {
      try {
        const result = await authenticationService.signOut(context.session ?? {})
        context.clearSessionCookie()
        return { __typename: 'SignOutSuccess', ...result }
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
  })
}
