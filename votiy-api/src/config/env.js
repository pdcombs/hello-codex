import { z } from 'zod'

const LOCAL_TOKEN_PEPPER = 'local-development-token-pepper-change-before-production'
const csv = z.string().default('').transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean))

function productionDiagnostics(environment) {
  return JSON.stringify({
    nodeEnvironment: environment.nodeEnvironment,
    appOrigin: environment.appOrigin,
    emailTransport: environment.emailTransport,
    hasTokenPepper: Boolean(environment.tokenPepper && environment.tokenPepper !== LOCAL_TOKEN_PEPPER),
    hasEmailProviderEndpoint: Boolean(environment.emailProviderEndpoint),
    hasEmailProviderApiKey: Boolean(environment.emailProviderApiKey),
    mongoDatabase: environment.mongoDatabase,
  })
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  MONGODB_URI: z.string().min(1).default(
    'mongodb://root:localpassword@127.0.0.1:27017/votiy?authSource=admin',
  ),
  MONGODB_DATABASE: z.string().trim().min(1).max(64).default('votiy'),
  APP_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  SESSION_COOKIE_NAME: z.string().regex(/^[A-Za-z0-9_-]+$/).default('votiy_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(1_209_600),
  SESSION_IDLE_TTL_SECONDS: z.coerce.number().int().positive().default(604_800),
  TOKEN_PEPPER: z.string().min(32).default(LOCAL_TOKEN_PEPPER),
  VERIFICATION_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
  EMAIL_TRANSPORT: z.enum(['fake', 'mailpit', 'provider']).default('mailpit'),
  EMAIL_FROM: z.string().trim().min(3).default('Votiy <no-reply@votiy.local>'),
  SMTP_HOST: z.string().trim().min(1).default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(1025),
  EMAIL_PROVIDER_ENDPOINT: z.union([z.literal(''), z.string().url()]).default(''),
  EMAIL_PROVIDER_API_KEY: z.string().default(''),
  VERIFICATION_BYPASS_EMAILS: csv,
  VERIFICATION_BYPASS_DOMAINS: csv,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export function assertAccountFeatureEnvironment(environment) {
  if (!environment.isProduction) return environment

  const problems = []

  if (environment.tokenPepper === LOCAL_TOKEN_PEPPER) problems.push('TOKEN_PEPPER')
  if (environment.emailTransport !== 'provider') problems.push('EMAIL_TRANSPORT')
  if (!environment.emailProviderEndpoint) problems.push('EMAIL_PROVIDER_ENDPOINT')
  if (!environment.emailProviderApiKey) problems.push('EMAIL_PROVIDER_API_KEY')
  if (!environment.appOrigin.startsWith('https://')) problems.push('APP_ORIGIN')

  if (problems.length > 0) {
    throw new Error(
      `Invalid production configuration: ${problems.join(', ')} | detected=${productionDiagnostics(environment)}`,
    )
  }

  return environment
}

export function loadEnvironment(source = process.env) {
  const result = environmentSchema.safeParse(source)

  if (!result.success) {
    const fields = result.error.issues.map(({ path }) => path.join('.')).filter(Boolean)
    throw new Error(`Invalid environment configuration: ${[...new Set(fields)].join(', ')}`)
  }

  if (result.data.SESSION_IDLE_TTL_SECONDS > result.data.SESSION_TTL_SECONDS) {
    throw new Error('Invalid environment configuration: SESSION_IDLE_TTL_SECONDS')
  }

  return Object.freeze({
    nodeEnvironment: result.data.NODE_ENV,
    isProduction: result.data.NODE_ENV === 'production',
    port: result.data.PORT,
    mongoUri: result.data.MONGODB_URI,
    mongoDatabase: result.data.MONGODB_DATABASE,
    appOrigin: result.data.APP_ORIGIN,
    sessionCookieName: result.data.SESSION_COOKIE_NAME,
    sessionTtlSeconds: result.data.SESSION_TTL_SECONDS,
    sessionIdleTtlSeconds: result.data.SESSION_IDLE_TTL_SECONDS,
    tokenPepper: result.data.TOKEN_PEPPER,
    verificationTtlSeconds: result.data.VERIFICATION_TTL_SECONDS,
    emailTransport: result.data.EMAIL_TRANSPORT,
    emailFrom: result.data.EMAIL_FROM,
    smtpHost: result.data.SMTP_HOST,
    smtpPort: result.data.SMTP_PORT,
    emailProviderEndpoint: result.data.EMAIL_PROVIDER_ENDPOINT,
    emailProviderApiKey: result.data.EMAIL_PROVIDER_API_KEY,
    verificationBypassEmails: result.data.VERIFICATION_BYPASS_EMAILS,
    verificationBypassDomains: result.data.VERIFICATION_BYPASS_DOMAINS,
    logLevel: result.data.LOG_LEVEL,
  })
}
