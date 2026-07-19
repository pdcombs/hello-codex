import { readFile } from 'node:fs/promises'
import { buildSchema } from 'graphql'
import { describe, expect, it } from 'vitest'

const contract = new URL('../../../specs/003-entry-derived-participants/contracts/schema.graphql', import.meta.url)

describe('remove category GraphQL contract', () => {
  it('adds the archival mutation without replacing legacy category operations', async () => {
    const schema = buildSchema(await readFile(contract, 'utf8'))
    expect(schema.getMutationType().getFields()).toMatchObject({
      addEventCategory: expect.any(Object), renameEventCategory: expect.any(Object),
      updateEventCategory: expect.any(Object), archiveEventCategory: expect.any(Object),
    })
    const input = schema.getType('ArchiveEventCategoryInput').getFields()
    expect(Object.keys(input)).toEqual(['eventId', 'categoryId', 'expectedEventUpdatedAt',
      'expectedCategoryUpdatedAt', 'activeEntries', 'idempotencyKey'])
  })
})
