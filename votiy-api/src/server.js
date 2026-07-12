import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import argon2 from 'argon2'
import { createAccountResolvers } from './api/graphql/account-resolvers.js'
import { createEventResolvers } from './api/graphql/event-resolvers.js'
import { createGraphqlHandler } from './api/graphql/handler.js'
import { createGraphqlSchema } from './api/graphql/schema.js'
import { createSessionContext } from './api/graphql/session-context.js'
import { createSessionResolvers } from './api/graphql/session-resolvers.js'
import { createHealthHandlers } from './api/health.js'
import { createApplication } from './app.js'
import { assertAccountFeatureEnvironment, loadEnvironment } from './config/env.js'
import { digestIdempotencyRequest, digestSecret, generateOpaqueToken } from './domain/security.js'
import { createVerificationBypassPolicy } from './domain/verification-bypass.js'
import { createEmailSender } from './email/email-sender.js'
import { createFakeSender } from './email/fake-sender.js'
import { createMailpitSender } from './email/mailpit-sender.js'
import { createProviderSender } from './email/provider-sender.js'
import { createLogger } from './observability/logger.js'
import { runEventSetupMigration } from './migrations/002-event-categories-entries.js'
import { createAccountRepository } from './repositories/account-repository.js'
import { createAuditEventRepository } from './repositories/audit-event-repository.js'
import { createEventRegistrationRepository } from './repositories/event-registration-repository.js'
import { createEventRepository } from './repositories/event-repository.js'
import { createIdempotencyRepository } from './repositories/idempotency-repository.js'
import { enforceEventSetupValidators, ensureCollectionsAndIndexes } from './repositories/indexes.js'
import { createMongoConnection } from './repositories/mongo.js'
import { createSessionRepository } from './repositories/session-repository.js'
import { createVerificationRepository } from './repositories/verification-repository.js'
import { createRegistrationService } from './services/registration-service.js'
import { createAuthenticationService } from './services/authentication-service.js'
import { createEventRegistrationService } from './services/event-registration-service.js'
import { createEventService } from './services/event-service.js'
import { createSessionService } from './services/session-service.js'
import { createVerificationService } from './services/verification-service.js'

const environment = assertAccountFeatureEnvironment(loadEnvironment())
const sourceDirectory = dirname(fileURLToPath(import.meta.url))
const frontendDirectory = join(sourceDirectory, '..', '..', 'votiy-web', 'dist')
const logger = createLogger({ level: environment.logLevel, environment: environment.nodeEnvironment })
const mongo = createMongoConnection({ uri: environment.mongoUri, databaseName: environment.mongoDatabase })

await mongo.connect()
await ensureCollectionsAndIndexes(mongo.database)
await runEventSetupMigration({ database: mongo.database, logger })
await enforceEventSetupValidators(mongo.database)

const accountRepository = createAccountRepository(mongo.database)
const verificationRepository = createVerificationRepository(mongo.database)
const sessionRepository = createSessionRepository(mongo.database)
const eventRepository = createEventRepository(mongo.database)
const eventRegistrationRepository = createEventRegistrationRepository(mongo.database)
const idempotencyRepository = createIdempotencyRepository(mongo.database)
const auditRepository = createAuditEventRepository(mongo.database)
const transport =
  environment.emailTransport === 'provider'
    ? createProviderSender({ endpoint: environment.emailProviderEndpoint, apiKey: environment.emailProviderApiKey })
    : environment.emailTransport === 'fake'
      ? createFakeSender({ logger })
      : createMailpitSender({ host: environment.smtpHost, port: environment.smtpPort })
const emailSender = createEmailSender({
  transport,
  appOrigin: environment.appOrigin,
  from: environment.emailFrom,
})
const digestToken = (token) => digestSecret(token, environment.tokenPepper)
const verificationBypassPolicy = createVerificationBypassPolicy({
  emails: environment.verificationBypassEmails,
  domains: environment.verificationBypassDomains,
})
const registrationService = createRegistrationService({
  accountRepository,
  verificationRepository,
  idempotencyRepository,
  emailSender,
  passwordHasher: { hash: (password) => argon2.hash(password, { type: argon2.argon2id }) },
  generateToken: generateOpaqueToken,
  digestToken,
  digestRequest: digestIdempotencyRequest,
  verificationTtlSeconds: environment.verificationTtlSeconds,
  verificationBypassPolicy,
  logger,
})
const verificationService = createVerificationService({
  accountRepository,
  verificationRepository,
  sessionRepository,
  emailSender,
  digestToken,
  generateToken: generateOpaqueToken,
  generateSessionSecret: generateOpaqueToken,
  digestSessionSecret: digestToken,
  verificationTtlSeconds: environment.verificationTtlSeconds,
  sessionTtlSeconds: environment.sessionTtlSeconds,
  verificationBypassPolicy,
  logger,
})
const sessionService = createSessionService({
  accountRepository,
  sessionRepository,
  digestSessionSecret: digestToken,
  logger,
})
const authenticationService = createAuthenticationService({
  accountRepository,
  sessionRepository,
  passwordHasher: { verify: argon2.verify },
  digestSessionSecret: digestToken,
  generateSessionSecret: generateOpaqueToken,
  sessionTtlSeconds: environment.sessionTtlSeconds,
  logger,
})
const eventService = createEventService({
  eventRepository,
  idempotencyRepository,
  logger,
})
const eventRegistrationService = createEventRegistrationService({
  eventRepository,
  eventRegistrationRepository,
  accountRepository,
  idempotencyRepository,
  withTransaction: mongo.withTransaction,
  logger,
})
const schema = await createGraphqlSchema()
const rootValue = {
  ...createAccountResolvers({
    registrationService,
    verificationService,
    sessionService: authenticationService,
    auditRepository,
  }),
  ...createSessionResolvers({ authenticationService, auditRepository }),
  ...createEventResolvers({ eventService, eventRegistrationService, auditRepository }),
}
const graphqlHandler = createGraphqlHandler({
  schema,
  rootValue,
  appOrigin: environment.appOrigin,
  isProduction: environment.isProduction,
  contextFactory: async ({ request, response, correlationId }) => {
    const context = createSessionContext({
      request,
      response,
      correlationId,
      environment,
    })
    if (!context.session) return { ...context, viewer: null }
    try {
      const { account } = await authenticationService.viewer(context.session)
      return { ...context, viewer: { account } }
    } catch {
      return { ...context, viewer: null }
    }
  },
})
const { healthHandler, readyHandler } = createHealthHandlers({ mongo, migrationReady: true })
const application = createApplication({ frontendDirectory, graphqlHandler, healthHandler, readyHandler, logger })
const server = createServer(application)
const host = environment.isProduction ? '0.0.0.0' : '127.0.0.1'

server.listen(environment.port, host, () => logger.info({ host, port: environment.port }, 'Votiy API started'))

async function shutdown() {
  server.close()
  await mongo.close()
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
