import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createLogger } from '../../src/observability/logger.js'
import { createEventSearchService } from '../../src/services/event-search-service.js'

describe('event search observability', () => {
  it('records timing and counts without raw query or visitor data', async () => {
    let output = ''
    const logger = createLogger({}, new Writable({ write(chunk, _encoding, done) { output += chunk; done() } }))
    const service = createEventSearchService({
      eventRepository: { search: async () => [] }, cursorSecret: 'secret', logger,
      now: (() => { let value = 0; return () => value += 5 })(),
    })
    await service.search({ query: 'secret visitor@example.test', first: 20 }, { correlationId: 'correlation' })
    expect(output).toContain('event.search.completed')
    expect(output).not.toContain('secret visitor')
    expect(output).not.toContain('visitor@example.test')
  })
})
