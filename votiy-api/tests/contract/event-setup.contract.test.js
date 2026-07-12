import { describe, expect, it } from 'vitest'
import { createGraphqlSchema, validateGraphqlOperation } from '../../src/api/graphql/schema.js'

describe('event setup GraphQL contract', () => {
  it('requires display names and complete nested entry inputs', async () => {
    const schema = await createGraphqlSchema()
    const operations = [
      'mutation Register($input: RegisterInput!) { register(input: $input) { __typename } }',
      'mutation Add($input: AddEventParticipantInput!) { addEventParticipant(input: $input) { __typename } }',
      'mutation Self($input: RegisterForEventInput!) { registerForEvent(input: $input) { __typename } }',
    ]
    for (const operation of operations) expect(validateGraphqlOperation(schema, operation).errors).toEqual([])
    expect(schema.getType('AddEventParticipantInput').getFields()).toMatchObject({
      displayName: expect.any(Object), entries: expect.any(Object),
    })
  })

  it('exposes host category create and rename mutations with typed inputs', async () => {
    const schema = await createGraphqlSchema()
    const mutations = schema.getMutationType().getFields()
    expect(mutations.addEventCategory.args[0].type.toString()).toBe('AddEventCategoryInput!')
    expect(mutations.renameEventCategory.args[0].type.toString()).toBe('RenameEventCategoryInput!')
  })

  it('publishes grouped entry owners without registration contact fields', async () => {
    const schema = await createGraphqlSchema()
    const eventFields = schema.getType('Event').getFields()
    const entryFields = schema.getType('EventEntry').getFields()
    expect(eventFields.categories.type.toString()).toBe('[EventCategory!]!')
    expect(entryFields).toMatchObject({ title: expect.any(Object), ownerDisplayName: expect.any(Object) })
    expect(entryFields.email).toBeUndefined()
    expect(entryFields.phone).toBeUndefined()
  })

  it('exposes host participant summaries with entry counts', async () => {
    const schema = await createGraphqlSchema()
    const fields = schema.getType('EventRegistration').getFields()
    expect(fields).toMatchObject({ displayName: expect.any(Object), entryCount: expect.any(Object) })
    expect(fields.entryCount.type.toString()).toBe('Int!')
    expect(schema.getQueryType().getFields().eventRegistrations.type.toString()).toBe('EventRegistrationListResult!')
  })
})
