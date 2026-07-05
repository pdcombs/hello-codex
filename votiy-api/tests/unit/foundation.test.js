import { describe, expect, it } from 'vitest'
import { loadEnvironment } from '../../src/config/env.js'
import { ApplicationError, ErrorCode, toClientError } from '../../src/domain/errors.js'
import {
  constantTimeEqual,
  digestIdempotencyRequest,
  digestSecret,
  generateOpaqueToken,
  normalizeEmail,
} from '../../src/domain/security.js'
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

  it('rejects unsafe production defaults', () => {
    expect(() => loadEnvironment({ NODE_ENV: 'production' })).toThrow('Invalid production configuration')
  })

  it('rejects an idle session lifetime longer than the absolute lifetime', () => {
    expect(() => loadEnvironment({ SESSION_TTL_SECONDS: '60', SESSION_IDLE_TTL_SECONDS: '61' }))
      .toThrow('SESSION_IDLE_TTL_SECONDS')
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

  it('requires exactly one participant identifier', () => {
    expect(participantIdentifierSchema.safeParse({ email: 'person@example.com' }).success).toBe(true)
    expect(participantIdentifierSchema.safeParse({ phone: '+14155552671' }).success).toBe(true)
    expect(participantIdentifierSchema.safeParse({
      email: 'person@example.com',
      phone: '+14155552671',
    }).success).toBe(false)
    expect(participantIdentifierSchema.safeParse({}).success).toBe(false)
  })
})
