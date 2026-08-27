import { ObjectId } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationError, ErrorCode } from '../../src/domain/errors.js'
import { createAccountResolvers } from '../../src/api/graphql/account-resolvers.js'

function setup(service) {
  const auditRepository = { append: vi.fn() }
  const resolvers = createAccountResolvers({ registrationService: {}, verificationService: {}, sessionService: {},
    passwordResetService: service, auditRepository })
  const context = { correlationId: 'correlation-1', clearSessionCookie: vi.fn() }
  return { resolvers, auditRepository, context }
}
describe('password reset resolvers', () => {
  it.each([
    ['bypass', 'password_reset.bypassed', 'success'],
    ['email_failed', 'password_reset.email_failed', 'failure'],
    ['email', 'password_reset.requested', 'success'],
    [null, 'password_reset.requested', 'success'],
  ])('maps request delivery %s to safe audit', async (deliveryPath, name, outcome) => {
    const x = setup({ request: vi.fn().mockResolvedValue({ accepted: true, bypassToken: deliveryPath === 'bypass' ? 'token' : null,
      accountId: deliveryPath ? new ObjectId() : null, deliveryPath }) })
    expect(await x.resolvers.requestPasswordReset({ input: { email: 'x@y.com' } }, x.context))
      .toMatchObject({ __typename: 'PasswordResetRequestSuccess' })
    expect(x.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({ name, outcome }))
  })
  it('maps request and inspect failures', async () => {
    const error = new ApplicationError(ErrorCode.VALIDATION_FAILED)
    const x = setup({ request: vi.fn().mockRejectedValue(error), inspect: vi.fn().mockRejectedValue(error) })
    expect(await x.resolvers.requestPasswordReset({ input: {} }, x.context)).toMatchObject({ __typename: 'OperationError', code: 'VALIDATION_FAILED' })
    expect(await x.resolvers.inspectPasswordReset({ input: {} }, x.context)).toMatchObject({ __typename: 'OperationError' })
  })
  it('returns inspection and reset success, clearing cookie and auditing', async () => {
    const id = new ObjectId(); const x = setup({ inspect: vi.fn().mockResolvedValue({ email: 'u@e.com', expiresAt: new Date() }),
      reset: vi.fn().mockResolvedValue({ reset: true, accountId: id }) })
    expect(await x.resolvers.inspectPasswordReset({ input: {} }, x.context)).toMatchObject({ __typename: 'PasswordResetInspectionSuccess', email: 'u@e.com' })
    expect(await x.resolvers.resetPassword({ input: {} }, x.context)).toMatchObject({ __typename: 'PasswordResetSuccess', reset: true })
    expect(x.context.clearSessionCookie).toHaveBeenCalled()
    expect(x.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({ name: 'password_reset.completed' }))
  })
  it('audits reset denial with safe error code', async () => {
    const x = setup({ reset: vi.fn().mockRejectedValue(new ApplicationError(ErrorCode.INVALID_OR_EXPIRED_TOKEN)) })
    expect(await x.resolvers.resetPassword({ input: {} }, x.context)).toMatchObject({ __typename: 'OperationError' })
    expect(x.auditRepository.append).toHaveBeenCalledWith(expect.objectContaining({ name: 'password_reset.denied',
      metadata: { errorCode: 'INVALID_OR_EXPIRED_TOKEN' } }))
  })
})
