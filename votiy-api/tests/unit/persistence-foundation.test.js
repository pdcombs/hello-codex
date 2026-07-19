import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { createHealthHandlers } from '../../src/api/health.js'
import { createApplication } from '../../src/app.js'
import { AUDIT_EVENT_NAMES, createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

function responseRecorder() {
  const response = new EventEmitter()
  response.headers = {}
  response.statusCode = 200
  response.setHeader = (name, value) => { response.headers[name] = value }
  response.writeHead = (statusCode, headers = {}) => {
    response.statusCode = statusCode
    Object.assign(response.headers, headers)
  }
  response.end = (body = '') => { response.body = body; response.emit('finish') }
  return response
}

describe('persistence definitions', () => {
  it('defines validators and every required index', () => {
    expect(Object.keys(collectionDefinitions)).toEqual([
      'accounts', 'emailVerifications', 'sessions', 'events', 'eventRegistrations',
      'eventEntries', 'votingAccessCodes', 'eventVoterAccess', 'ballotSubmissions',
      'idempotencyRecords', 'auditEvents',
    ])
    const indexNames = Object.values(collectionDefinitions).flatMap(({ indexes }) => indexes.map(({ name }) => name))
    expect(indexNames).toContain('account_email_unique')
    expect(indexNames).toContain('registration_event_account_unique')
    expect(indexNames).toContain('entry_event_owner_active')
    expect(indexNames).toContain('idempotency_expiry_ttl')
    expect(indexNames).toContain('audit_correlation')
  })
})

describe('audit event repository', () => {
  it('only appends allowlisted, sanitized events', async () => {
    const insertOne = vi.fn()
    const repository = createAuditEventRepository({ collection: () => ({ insertOne }) })
    const event = await repository.append({
      name: AUDIT_EVENT_NAMES[0], subjectType: 'account', subjectId: 'account-1',
      outcome: 'success', correlationId: 'correlation-1', metadata: { lifecycleStatus: 'completed' },
    })
    expect(event.name).toBe('account.registered')
    expect(Object.isFrozen(event)).toBe(true)
    expect(insertOne).toHaveBeenCalledOnce()
  })

  it('rejects unknown events and private metadata', async () => {
    const repository = createAuditEventRepository({ collection: () => ({ insertOne: vi.fn() }) })
    await expect(repository.append({
      name: 'account.password_seen', subjectType: 'account', subjectId: '1',
      outcome: 'success', correlationId: 'correlation-1',
    })).rejects.toThrow('Unknown audit event name')
    await expect(repository.append({
      name: 'account.registered', subjectType: 'account', subjectId: '1', outcome: 'success',
      correlationId: 'correlation-1', metadata: { email: 'private@example.com' },
    })).rejects.toThrow('disallowed field')
  })
})

describe('health and request boundaries', () => {
  it('separates liveness from dependency readiness', async () => {
    const mongo = { isReady: vi.fn().mockResolvedValue(false) }
    const { healthHandler, readyHandler } = createHealthHandlers({ mongo })
    const healthResponse = responseRecorder()
    const readyResponse = responseRecorder()
    healthHandler({}, healthResponse)
    await readyHandler({}, readyResponse)
    expect(healthResponse.statusCode).toBe(200)
    expect(readyResponse.statusCode).toBe(503)
    expect(JSON.parse(readyResponse.body).dependencies.mongodb).toBe('unavailable')
  })

  it('assigns a correlation ID to every application request', async () => {
    const healthHandler = (_request, response) => response.end('{}')
    const application = createApplication({
      frontendDirectory: '/tmp/unused', healthHandler,
      graphqlHandler: vi.fn(), readyHandler: vi.fn(),
    })
    const response = responseRecorder()
    await application({ method: 'GET', url: '/health', headers: {} }, response)
    expect(response.headers['X-Correlation-ID']).toMatch(/^[0-9a-f-]{36}$/)
  })
})
