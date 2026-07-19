import { describe, expect, it } from 'vitest'
import { collectionDefinitions } from '../../src/repositories/indexes.js'

describe('event voting persistence contract', () => {
  it('declares protected collections and required unique indexes', () => {
    expect(collectionDefinitions).toHaveProperty('votingAccessCodes')
    expect(collectionDefinitions).toHaveProperty('eventVoterAccess')
    expect(collectionDefinitions).toHaveProperty('ballotSubmissions')
    expect(collectionDefinitions.votingAccessCodes.indexes).toContainEqual(expect.objectContaining({
      name: 'voting_code_event_digest_unique', unique: true,
    }))
    expect(collectionDefinitions.eventVoterAccess.indexes).toContainEqual(expect.objectContaining({
      name: 'voter_access_event_account_unique', unique: true,
    }))
    expect(collectionDefinitions.ballotSubmissions.indexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'ballot_event_browser_unique', unique: true }),
      expect.objectContaining({ name: 'ballot_access_code_unique', unique: true }),
    ]))
  })

  it('supports legacy event versions during migration and strict version three after it', () => {
    const schemas = collectionDefinitions.events.validator.$jsonSchema.oneOf
    expect(schemas.map((schema) => schema.properties.schemaVersion.enum[0])).toEqual([1, 2, 3])
    expect(schemas[2].required).toContain('votingRules')
  })
})
