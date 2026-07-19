import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('add entries GraphQL contract', () => {
  it('adds owner choices and single-entry creation without removing legacy operations', async () => {
    const schema = await createGraphqlSchema()
    expect(schema.getQueryType().getFields()).toMatchObject({ entryOwnerChoices: expect.any(Object) })
    expect(schema.getMutationType().getFields()).toMatchObject({
      createEventEntry: expect.any(Object),
      createEventEntriesForParticipant: expect.any(Object),
      archiveEventEntry: expect.any(Object),
    })
  })

  it('validates representative choice and creation operations', async () => {
    const schema = await createGraphqlSchema()
    const operations = [
      `query Choices($eventId: ID!, $search: String) {
        entryOwnerChoices(eventId: $eventId, search: $search) { __typename }
      }`,
      `mutation Create($input: CreateEventEntryInput!) {
        createEventEntry(input: $input) { __typename }
      }`,
    ]
    for (const source of operations) expect(validateGraphqlOperation(schema, source).errors).toEqual([])
  })
})
