import { Writable } from 'node:stream'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createHealthHandlers } from '../../src/api/health.js'
import { createApplication } from '../../src/app.js'
import { createAccountResolvers } from '../../src/api/graphql/account-resolvers.js'
import { createLogger, logGroupedView } from '../../src/observability/logger.js'
import { AUDIT_EVENT_NAMES, createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'

function response() {
  return { writeHead(statusCode) { this.statusCode = statusCode }, end(body) { this.body = JSON.parse(body) } }
}

describe('polish decision paths', () => {
  it('reports migration readiness separately from MongoDB', async () => {
    const unavailable = createHealthHandlers({ mongo: { isReady: async () => true }, migrationReady: false })
    const failed = response()
    await unavailable.readyHandler({}, failed)
    expect(failed).toMatchObject({ statusCode: 503, body: { dependencies: { mongodb: 'ready', migration: 'unavailable' } } })
    const ready = response()
    await createHealthHandlers({ mongo: { isReady: async () => true } }).readyHandler({}, ready)
    expect(ready.statusCode).toBe(200)
  })

  it('logs grouped success/failure without titles, display names, or contacts', () => {
    let output = ''
    const destination = new Writable({ write(chunk, _encoding, done) { output += chunk; done() } })
    const logger = createLogger({}, destination)
    logger.info({ title: 'Secret title', displayName: 'Secret name', email: 'private@example.test', phone: '+15555550100' })
    logGroupedView(logger, { outcome: 'success', durationMs: 12.345, categoryCount: 2, entryCount: 3 })
    logGroupedView(logger, { outcome: 'failure', durationMs: 1, errorCode: 'SERVICE_UNAVAILABLE' })
    logGroupedView(null, { outcome: 'success', durationMs: 0 })
    expect(output).not.toContain('Secret title')
    expect(output).not.toContain('Secret name')
    expect(output).not.toContain('private@example.test')
    expect(output).not.toContain('+15555550100')
    expect(output).toContain('SERVICE_UNAVAILABLE')
  })

  it('keeps audit allowlist exhaustive and rejects private metadata', async () => {
    const insertOne = vi.fn()
    const repository = createAuditEventRepository({ collection: () => ({ insertOne }) })
    for (const name of AUDIT_EVENT_NAMES) await repository.append({ name, subjectType: 'event', subjectId: '1',
      outcome: 'success', correlationId: 'correlation' })
    expect(insertOne).toHaveBeenCalledTimes(AUDIT_EVENT_NAMES.length)
    await expect(repository.append({ name: 'event.created', subjectType: 'event', subjectId: '1', outcome: 'success',
      correlationId: 'correlation', metadata: { title: 'private' } })).rejects.toThrow('disallowed field')
  })

  it('supports account resolver branches without optional audit repository', async () => {
    const account = { _id: 'account-1', displayName: 'Peyton', emailNormalized: 'peyton@example.test',
      verificationStatus: 'pending', createdAt: new Date('2026-01-01') }
    const registrationService = { register: vi.fn().mockResolvedValue({ account, verificationToken: null }) }
    const verificationService = { verifyEmail: vi.fn().mockResolvedValue({ account, sessionSecret: 'secret' }),
      resendVerification: vi.fn().mockResolvedValue({ account, verificationToken: null }) }
    const sessionService = { viewer: vi.fn().mockResolvedValue({ account }) }
    const resolvers = createAccountResolvers({ registrationService, verificationService, sessionService })
    const context = { correlationId: 'correlation', setSessionCookie: vi.fn(), session: { accountId: 'account-1' } }
    await expect(resolvers.register({ input: {} }, context)).resolves.toMatchObject({ __typename: 'AccountSuccess' })
    await expect(resolvers.verifyEmail({ input: {} }, context)).resolves.toMatchObject({ __typename: 'SessionSuccess' })
    await expect(resolvers.resendVerification({}, context)).resolves.toMatchObject({ __typename: 'AccountSuccess' })
    await expect(resolvers.viewer({}, context)).resolves.toMatchObject({ __typename: 'SessionSuccess' })
    registrationService.register.mockRejectedValueOnce(new Error('failure'))
    await expect(resolvers.register({ input: {} }, context)).resolves.toMatchObject({ code: 'SERVICE_UNAVAILABLE' })
  })

  it('serves frontend GET/HEAD, SPA fallback, commit diagnostics, and unknown methods', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'votiy-app-'))
    await writeFile(join(directory, 'index.html'), '<main>app</main>')
    await writeFile(join(directory, 'app.js'), 'export default true')
    const graphqlHandler = vi.fn((_, response_) => response_.end('graphql'))
    const readyHandler = vi.fn((_, response_) => response_.end('ready'))
    const application = createApplication({ frontendDirectory: directory, graphqlHandler,
      healthHandler: vi.fn(), readyHandler, logger: { info: vi.fn() } })
    const makeResponse = () => ({ headers: {}, setHeader(name, value) { this.headers[name] = value },
      writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = { ...this.headers, ...headers } },
      end(body = '') { this.body = body }, once: vi.fn() })
    const previousCommit = process.env.APP_COMMIT_SHA
    process.env.APP_COMMIT_SHA = 'commit-123'
    try {
      const home = makeResponse(); await application({ method: 'GET', url: '/', headers: {} }, home)
      expect(String(home.body)).toContain('app')
      expect(home.headers['X-App-Commit']).toBe('commit-123')
      const head = makeResponse(); await application({ method: 'HEAD', url: '/app.js', headers: {} }, head)
      expect(head.statusCode).toBe(200)
      const fallback = makeResponse(); await application({ method: 'GET', url: '/events/missing', headers: {} }, fallback)
      expect(String(fallback.body)).toContain('app')
      const missing = makeResponse(); await application({ method: 'POST', url: '/missing', headers: {} }, missing)
      expect(missing.statusCode).toBe(404)
      const ready = makeResponse(); await application({ method: 'GET', url: '/ready', headers: {} }, ready)
      expect(readyHandler).toHaveBeenCalled()
      const graphql = makeResponse(); await application({ method: 'POST', url: '/graphql', headers: {} }, graphql)
      expect(graphqlHandler).toHaveBeenCalled()
      const withoutReady = createApplication({ frontendDirectory: directory, graphqlHandler, healthHandler: vi.fn() })
      const readyFallback = makeResponse(); await withoutReady({ method: 'GET', url: '/ready', headers: {} }, readyFallback)
      expect(String(readyFallback.body)).toContain('app')
    } finally {
      if (previousCommit === undefined) delete process.env.APP_COMMIT_SHA
      else process.env.APP_COMMIT_SHA = previousCommit
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('validates every required application dependency branch', () => {
    expect(() => createApplication({})).toThrow('required')
    expect(() => createApplication({ frontendDirectory: '/tmp' })).toThrow('required')
    expect(() => createApplication({ frontendDirectory: '/tmp', graphqlHandler: vi.fn() })).toThrow('required')
  })
})
