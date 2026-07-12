import { describe, expect, it } from 'vitest'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'

describe('entry-derived participant GraphQL contract', () => {
  it('separates creation and archive payloads and protects participant contact reads', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getType('EntryCreationPayload').getFields()).toMatchObject({
      createdEntries: expect.any(Object), affectedParticipant: expect.any(Object),
    })
    expect(schema.getType('EntryArchivePayload').getFields()).toMatchObject({
      archivedEntryIds: expect.any(Object), affectedParticipant: expect.any(Object),
    })
    expect(schema.getQueryType().getFields().eventParticipants).toBeDefined()
    expect(schema.getMutationType().getFields()).toMatchObject({
      archiveEventEntry: expect.any(Object), archiveEventParticipantEntries: expect.any(Object),
    })
    expect(schema.getType('EventEntry').getFields().email).toBeUndefined()
  })
})
