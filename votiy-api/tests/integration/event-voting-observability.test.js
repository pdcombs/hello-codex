import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createLogger } from '../../src/observability/logger.js'
import { createAuditEventRepository } from '../../src/repositories/audit-event-repository.js'

describe('event voting privacy and observability', () => {
  it('redacts voting secrets and contacts from structured logs', () => {
    let output = ''
    const destination = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback() } })
    const logger = createLogger({}, destination)
    logger.info({ code: 'abc123', accessCode: 'def456', browserMarker: 'browser-secret',
      email: 'voter@example.test', phone: '+15555550100', choices: ['entry-secret'], ranks: [1] }, 'privacy scan')
    expect(output).not.toContain('abc123'); expect(output).not.toContain('def456')
    expect(output).not.toContain('browser-secret'); expect(output).not.toContain('voter@example.test')
    expect(output).not.toContain('+15555550100')
  })

  it('permits identifier-only voting audits and rejects ballot payload metadata', async () => {
    const documents = []
    const repository = createAuditEventRepository({ collection: () => ({ insertOne: async (document) => documents.push(document) }) })
    await repository.append({ name: 'voting.ballot_submitted', subjectType: 'ballotSubmission', subjectId: 'ballot-id',
      outcome: 'success', correlationId: 'correlation-id', metadata: { rulesVersion: 2, categoryCount: 3 } })
    expect(JSON.stringify(documents)).not.toMatch(/abc123|voter@example\.test|entry-secret/)
    await expect(repository.append({ name: 'voting.ballot_submitted', subjectType: 'ballotSubmission',
      subjectId: 'ballot-id', outcome: 'success', correlationId: 'correlation-id',
      metadata: { choices: ['entry-secret'], ranks: [1] } })).rejects.toThrow('disallowed field')
  })
})
