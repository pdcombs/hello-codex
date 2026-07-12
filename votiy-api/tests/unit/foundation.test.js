import { describe, expect, it, vi } from 'vitest'
import { assertAccountFeatureEnvironment, loadEnvironment } from '../../src/config/env.js'
import { ApplicationError, ErrorCode, toClientError } from '../../src/domain/errors.js'
import { createFakeSender } from '../../src/email/fake-sender.js'
import {
  constantTimeEqual,
  digestIdempotencyRequest,
  digestSecret,
  generateOpaqueToken,
  normalizeEmail,
} from '../../src/domain/security.js'
import { createVerificationBypassPolicy } from '../../src/domain/verification-bypass.js'
import {
  eventInputSchema,
  participantIdentifierSchema,
  registerInputSchema,
} from '../../src/domain/validation.js'

describe('environment configuration', () => {
  it('provides safe local defaults', () => {
    const environment = loadEnvironment({})
    expect(environment.nodeEnvironment).toBe('development')
    expect(environment.mongoDatabase).toBe('votiy')
    expect(environment.isProduction).toBe(false)
  })

  it('allows the current production shell to boot before account features are enabled', () => {
    expect(loadEnvironment({ NODE_ENV: 'production' }).isProduction).toBe(true)
  })

  it('rejects unsafe production settings when account features are wired', () => {
    const environment = loadEnvironment({ NODE_ENV: 'production' })
    expect(() => assertAccountFeatureEnvironment(environment)).toThrow(
      'Invalid production configuration: TOKEN_PEPPER, EMAIL_TRANSPORT, APP_ORIGIN | detected=',
    )
  })

  it('rejects an idle session lifetime longer than the absolute lifetime', () => {
    expect(() => loadEnvironment({ SESSION_TTL_SECONDS: '60', SESSION_IDLE_TTL_SECONDS: '61' }))
      .toThrow('SESSION_IDLE_TTL_SECONDS')
  })

  it('parses verification bypass allowlists from comma-separated environment values', () => {
    const environment = loadEnvironment({
      VERIFICATION_BYPASS_EMAILS: 'one@example.test, two@example.test ',
      VERIFICATION_BYPASS_DOMAINS: 'example.test, internal.test ',
    })
    expect(environment.verificationBypassEmails).toEqual(['one@example.test', 'two@example.test'])
    expect(environment.verificationBypassDomains).toEqual(['example.test', 'internal.test'])
  })

  it('allows temporary fake email transport in production when other required settings are present', () => {
    const environment = loadEnvironment({
      NODE_ENV: 'production',
      APP_ORIGIN: 'https://hello-codex-dc65.onrender.com',
      TOKEN_PEPPER: 'a'.repeat(32),
      EMAIL_TRANSPORT: 'fake',
    })
    expect(assertAccountFeatureEnvironment(environment).emailTransport).toBe('fake')
  })
})

describe('application errors', () => {
  it('maps expected errors to the stable client contract', () => {
    const error = new ApplicationError(ErrorCode.VALIDATION_FAILED, {
      fieldErrors: [{ field: 'title', code: 'too_small', message: 'Title is required' }],
    })
    expect(toClientError(error, 'correlation-1')).toEqual({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Check the highlighted fields and try again.',
      fieldErrors: [{ field: 'title', code: 'too_small', message: 'Title is required' }],
      correlationId: 'correlation-1',
    })
  })

  it('does not expose unexpected error details', () => {
    expect(toClientError(new Error('database password leaked'), 'correlation-2')).toEqual({
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: 'The service is temporarily unavailable.',
      fieldErrors: [],
      correlationId: 'correlation-2',
    })
  })

  it('rejects unknown codes and can expose an explicitly safe message', () => {
    expect(() => new ApplicationError('UNKNOWN')).toThrow('Unknown application error code')
    const error = new ApplicationError(ErrorCode.CONFLICT, {
      internalMessage: 'This event has already changed.',
      exposeMessage: true,
    })
    expect(toClientError(error).message).toBe('This event has already changed.')
  })
})

describe('security helpers', () => {
  it('normalizes email addresses', () => {
    expect(normalizeEmail('  Host@Example.COM ')).toBe('host@example.com')
  })

  it('creates opaque secrets and deterministic peppered digests', () => {
    const token = generateOpaqueToken()
    expect(token.length).toBeGreaterThan(32)
    expect(digestSecret(token, 'a'.repeat(32))).toBe(digestSecret(token, 'a'.repeat(32)))
    expect(constantTimeEqual('same', 'same')).toBe(true)
    expect(constantTimeEqual('same', 'different')).toBe(false)
  })

  it('rejects weak token and digest inputs', () => {
    expect(() => generateOpaqueToken(8)).toThrow('at least 16')
    expect(() => digestSecret('', 'pepper')).toThrow('required')
  })

  it('digests equivalent object inputs independent of key order', () => {
    expect(digestIdempotencyRequest({ title: 'Vote', nested: { b: 2, a: 1 } }))
      .toBe(digestIdempotencyRequest({ nested: { a: 1, b: 2 }, title: 'Vote' }))
  })
})

describe('input validation', () => {
  it('normalizes valid event text and defaults registration policy', () => {
    const result = eventInputSchema.parse({
      title: '  Team lunch  ',
      description: '',
      location: '  Atrium  ',
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    })
    expect(result).toMatchObject({
      title: 'Team lunch',
      description: null,
      location: 'Atrium',
      registrationPolicy: 'ADMIN_MANAGED',
    })
  })

  it('rejects weak account input and overlong event text', () => {
    expect(registerInputSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
      idempotencyKey: 'not-a-uuid',
    }).success).toBe(false)
    expect(eventInputSchema.safeParse({
      title: 'x'.repeat(121),
      idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    }).success).toBe(false)
  })

  it('requires participant email and accepts an optional phone', () => {
    expect(participantIdentifierSchema.safeParse({ email: 'person@example.com' }).success).toBe(true)
    expect(participantIdentifierSchema.safeParse({ phone: '+14155552671' }).success).toBe(false)
    expect(participantIdentifierSchema.safeParse({
      email: 'person@example.com',
      phone: '+14155552671',
    }).success).toBe(true)
    expect(participantIdentifierSchema.safeParse({ email: 'person@example.com', phone: null }).success).toBe(true)
    expect(participantIdentifierSchema.safeParse({}).success).toBe(false)
  })
})

describe('verification bypass policy', () => {
  it('matches allowlisted emails and domains and returns a deterministic token', () => {
    const policy = createVerificationBypassPolicy({
      emails: ['qa@example.test'],
      domains: ['internal.test'],
    })
    expect(policy.enabled).toBe(true)
    expect(policy.matches('QA@example.test')).toBe(true)
    expect(policy.matches('person@internal.test')).toBe(true)
    expect(policy.matches('person@example.com')).toBe(false)
    expect(policy.tokenFor('QA@example.test')).toBe('test-verify:qa@example.test')
  })
})

describe('fake email transport', () => {
  it('captures deliveries without logging verification details', async () => {
    const logger = { info: vi.fn() }
    const sender = createFakeSender({ logger, deliveredAt: () => new Date('2026-07-07T01:00:00.000Z') })

    const result = await sender.send({
      to: 'host@example.com',
      subject: 'Verify your Votiy account',
      text: 'Verify your Votiy account: https://hello-codex-dc65.onrender.com/verify-email?token=test',
      token: 'test',
    })

    expect(result.deliveredAt.toISOString()).toBe('2026-07-07T01:00:00.000Z')
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'email.fake.send',
        outcome: 'success',
      }),
      'Captured fake email delivery',
    )
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('host@example.com')
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('token=test')
  })
})
