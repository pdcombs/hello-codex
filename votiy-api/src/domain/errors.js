export const ErrorCode = Object.freeze({
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  VOTING_NOT_CONFIGURED: 'VOTING_NOT_CONFIGURED',
  VOTING_NOT_OPEN: 'VOTING_NOT_OPEN',
  VOTING_CLOSED: 'VOTING_CLOSED',
  ACCOUNT_REQUIREMENTS_NOT_MET: 'ACCOUNT_REQUIREMENTS_NOT_MET',
  BALLOT_LIMIT_REACHED: 'BALLOT_LIMIT_REACHED',
  INVALID_ACCESS_CODE: 'INVALID_ACCESS_CODE',
  ACCESS_CODE_USED: 'ACCESS_CODE_USED',
  INVALID_BALLOT: 'INVALID_BALLOT',
  RULES_CHANGED: 'RULES_CHANGED',
})

const SAFE_MESSAGES = Object.freeze({
  [ErrorCode.AUTHENTICATION_REQUIRED]: 'Sign in to continue.',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Verify your email to continue.',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ErrorCode.INVALID_CREDENTIALS]: 'The email or password is incorrect.',
  [ErrorCode.INVALID_OR_EXPIRED_TOKEN]: 'This verification link is invalid or has expired.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RATE_LIMITED]: 'Too many attempts. Please try again later.',
  [ErrorCode.VALIDATION_FAILED]: 'Check the highlighted fields and try again.',
  [ErrorCode.CONFLICT]: 'The request conflicts with the current state.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable.',
  [ErrorCode.VOTING_NOT_CONFIGURED]: 'Voting has not been configured.',
  [ErrorCode.VOTING_NOT_OPEN]: 'Voting is not open yet.',
  [ErrorCode.VOTING_CLOSED]: 'Voting has closed.',
  [ErrorCode.ACCOUNT_REQUIREMENTS_NOT_MET]: 'Complete required account details to vote.',
  [ErrorCode.BALLOT_LIMIT_REACHED]: 'This account has reached its ballot limit.',
  [ErrorCode.INVALID_ACCESS_CODE]: 'The voting code is invalid or unavailable.',
  [ErrorCode.ACCESS_CODE_USED]: 'The voting code is invalid or unavailable.',
  [ErrorCode.INVALID_BALLOT]: 'Review ballot selections and try again.',
  [ErrorCode.RULES_CHANGED]: 'Voting rules changed. Refresh and try again.',
})

export class ApplicationError extends Error {
  constructor(code, options = {}) {
    if (!Object.hasOwn(SAFE_MESSAGES, code)) throw new TypeError(`Unknown application error code: ${code}`)
    super(options.internalMessage ?? SAFE_MESSAGES[code], { cause: options.cause })
    this.name = 'ApplicationError'
    this.code = code
    this.fieldErrors = options.fieldErrors ?? []
    this.exposeMessage = options.exposeMessage ?? false
  }
}

export function toClientError(error, correlationId) {
  if (error instanceof ApplicationError) {
    return {
      code: error.code,
      message: error.exposeMessage ? error.message : SAFE_MESSAGES[error.code],
      fieldErrors: error.fieldErrors,
      correlationId: correlationId ?? null,
    }
  }

  return {
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: SAFE_MESSAGES[ErrorCode.SERVICE_UNAVAILABLE],
    fieldErrors: [],
    correlationId: correlationId ?? null,
  }
}
