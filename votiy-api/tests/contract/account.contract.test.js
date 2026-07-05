import { graphql } from 'graphql'
import { describe, expect, it, vi } from 'vitest'
import { createAccountResolvers } from '../../src/api/graphql/account-resolvers.js'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'
import { ApplicationError, ErrorCode } from '../../src/domain/errors.js'

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      __typename
      ... on AccountSuccess {
        account { id email isVerified createdAt }
      }
      ... on OperationError {
        code message correlationId
        fieldErrors { field code message }
      }
    }
  }
`

const VERIFY_EMAIL = `
  mutation VerifyEmail($input: VerifyEmailInput!) {
    verifyEmail(input: $input) {
      __typename
      ... on SessionSuccess {
        session { account { id email isVerified createdAt } }
      }
      ... on OperationError {
        code message correlationId
        fieldErrors { field code message }
      }
    }
  }
`

const RESEND_VERIFICATION = `
  mutation ResendVerification {
    resendVerification {
      __typename
      ... on AccountSuccess {
        account { id email isVerified createdAt }
      }
      ... on OperationError {
        code message correlationId
        fieldErrors { field code message }
      }
    }
  }
`

const VIEWER = `
  query Viewer {
    viewer {
      __typename
      ... on SessionSuccess {
        session { account { id email isVerified createdAt } }
      }
      ... on OperationError {
        code message correlationId
        fieldErrors { field code message }
      }
    }
  }
`

const ACCOUNT = Object.freeze({
  id: 'account-1',
  email: 'host@example.com',
  isVerified: false,
  createdAt: new Date('2026-07-05T12:00:00.000Z'),
})

function createHarness(overrides = {}) {
  const registrationService = {
    register: vi.fn().mockResolvedValue({ account: ACCOUNT }),
  }
  const verificationService = {
    verifyEmail: vi.fn().mockResolvedValue({
      account: { ...ACCOUNT, isVerified: true },
      sessionSecret: 'raw-session-secret',
    }),
    resendVerification: vi.fn().mockResolvedValue({ account: ACCOUNT }),
  }
  const sessionService = {
    viewer: vi.fn().mockResolvedValue({ account: { ...ACCOUNT, isVerified: true } }),
  }
  const setSessionCookie = vi.fn()
  const rootValue = createAccountResolvers({
    registrationService,
    verificationService,
    sessionService,
    ...overrides,
  })

  return {
    registrationService,
    verificationService,
    sessionService,
    setSessionCookie,
    rootValue,
    contextValue: {
      correlationId: 'correlation-1',
      session: { accountId: 'account-1' },
      setSessionCookie,
    },
  }
}

async function execute({ source, rootValue, contextValue, variableValues }) {
  return graphql({
    schema: await createGraphqlSchema(),
    source,
    rootValue,
    contextValue,
    variableValues,
  })
}

describe('account GraphQL contract', () => {
  it('registers through the service and returns the public pending-account shape', async () => {
    const harness = createHarness()
    const input = {
      email: ' Host@Example.COM ',
      password: 'a sufficiently long password',
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }

    const result = await execute({
      source: REGISTER,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
      variableValues: { input },
    })

    expect(result.errors).toBeUndefined()
    expect(harness.registrationService.register).toHaveBeenCalledWith(input)
    expect(result.data.register).toEqual({
      __typename: 'AccountSuccess',
      account: {
        id: 'account-1',
        email: 'host@example.com',
        isVerified: false,
        createdAt: '2026-07-05T12:00:00.000Z',
      },
    })
  })

  it('verifies email, returns a verified session, and delegates secure cookie issuance', async () => {
    const harness = createHarness()

    const result = await execute({
      source: VERIFY_EMAIL,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
      variableValues: { input: { token: 'raw-verification-token' } },
    })

    expect(result.errors).toBeUndefined()
    expect(harness.verificationService.verifyEmail).toHaveBeenCalledWith({
      token: 'raw-verification-token',
    })
    expect(harness.setSessionCookie).toHaveBeenCalledWith('raw-session-secret')
    expect(result.data.verifyEmail).toMatchObject({
      __typename: 'SessionSuccess',
      session: { account: { id: 'account-1', isVerified: true } },
    })
  })

  it('resends verification only for the authenticated account in context', async () => {
    const harness = createHarness()

    const result = await execute({
      source: RESEND_VERIFICATION,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
    })

    expect(result.errors).toBeUndefined()
    expect(harness.verificationService.resendVerification).toHaveBeenCalledWith({
      accountId: 'account-1',
    })
    expect(result.data.resendVerification).toMatchObject({
      __typename: 'AccountSuccess',
      account: { id: 'account-1', isVerified: false },
    })
  })

  it('returns the authenticated viewer through the stable session union', async () => {
    const harness = createHarness()

    const result = await execute({
      source: VIEWER,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
    })

    expect(result.errors).toBeUndefined()
    expect(harness.sessionService.viewer).toHaveBeenCalledWith(harness.contextValue.session)
    expect(result.data.viewer).toMatchObject({
      __typename: 'SessionSuccess',
      session: { account: { id: 'account-1', isVerified: true } },
    })
  })

  it('maps correctable registration failures to field errors without leaking internals', async () => {
    const registrationService = {
      register: vi.fn().mockRejectedValue(
        new ApplicationError(ErrorCode.VALIDATION_FAILED, {
          internalMessage: 'password rule implementation detail',
          fieldErrors: [
            {
              field: 'password',
              code: 'too_small',
              message: 'Password must be at least 12 characters',
            },
          ],
        }),
      ),
    }
    const harness = createHarness({ registrationService })

    const result = await execute({
      source: REGISTER,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
      variableValues: {
        input: {
          email: 'host@example.com',
          password: 'too short!',
          idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        },
      },
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.register).toEqual({
      __typename: 'OperationError',
      code: 'VALIDATION_FAILED',
      message: 'Check the highlighted fields and try again.',
      correlationId: 'correlation-1',
      fieldErrors: [
        {
          field: 'password',
          code: 'too_small',
          message: 'Password must be at least 12 characters',
        },
      ],
    })
    expect(JSON.stringify(result)).not.toContain('implementation detail')
  })

  it.each([
    [
      'duplicate registration',
      REGISTER,
      'register',
      {
        input: {
          email: 'host@example.com',
          password: 'valid password',
          idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        },
      },
      ErrorCode.CONFLICT,
    ],
    [
      'invalid verification token',
      VERIFY_EMAIL,
      'verifyEmail',
      { input: { token: 'invalid-token' } },
      ErrorCode.INVALID_OR_EXPIRED_TOKEN,
    ],
    [
      'anonymous verification resend',
      RESEND_VERIFICATION,
      'resendVerification',
      undefined,
      ErrorCode.AUTHENTICATION_REQUIRED,
    ],
    ['anonymous viewer', VIEWER, 'viewer', undefined, ErrorCode.AUTHENTICATION_REQUIRED],
  ])('returns a safe union for %s', async (_label, source, field, variableValues, code) => {
    const failure = new ApplicationError(code, {
      internalMessage: 'private account or token detail',
    })
    const harness = createHarness({
      registrationService: { register: vi.fn().mockRejectedValue(failure) },
      verificationService: {
        verifyEmail: vi.fn().mockRejectedValue(failure),
        resendVerification: vi.fn().mockRejectedValue(failure),
      },
      sessionService: { viewer: vi.fn().mockRejectedValue(failure) },
    })

    const result = await execute({
      source,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
      variableValues,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data[field]).toMatchObject({
      __typename: 'OperationError',
      code,
      correlationId: 'correlation-1',
      fieldErrors: [],
    })
    expect(JSON.stringify(result)).not.toContain('private account or token detail')
  })

  it('converts unexpected resolver failures to a generic correlated service error', async () => {
    const harness = createHarness({
      registrationService: {
        register: vi.fn().mockRejectedValue(new Error('mongodb://user:secret@private-host')),
      },
    })

    const result = await execute({
      source: REGISTER,
      rootValue: harness.rootValue,
      contextValue: harness.contextValue,
      variableValues: {
        input: {
          email: 'host@example.com',
          password: 'a sufficiently long password',
          idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        },
      },
    })

    expect(result.errors).toBeUndefined()
    expect(result.data.register).toEqual({
      __typename: 'OperationError',
      code: 'SERVICE_UNAVAILABLE',
      message: 'The service is temporarily unavailable.',
      correlationId: 'correlation-1',
      fieldErrors: [],
    })
    expect(JSON.stringify(result)).not.toContain('private-host')
    expect(JSON.stringify(result)).not.toContain('secret')
  })
})
