import { ApplicationError, ErrorCode } from '../domain/errors.js'

export function createSessionService({
  accountRepository,
  sessionRepository,
  digestSessionSecret,
  now = () => new Date(),
  logger,
}) {
  return Object.freeze({
    async viewer(sessionInput) {
      let account
      if (sessionInput?.accountId) account = await accountRepository.findById(sessionInput.accountId)
      else if (sessionInput?.secret) {
        const session = await sessionRepository.findActiveByDigest(digestSessionSecret(sessionInput.secret), now())
        if (session) {
          account = await accountRepository.findById(session.accountId)
          if (account?.credentialVersion !== session.credentialVersion) account = null
        }
      }
      if (!account) {
        logger?.info({ operation: 'session.viewer', outcome: 'denied' }, 'Viewer authentication denied')
        throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      }
      return { account }
    },
  })
}
