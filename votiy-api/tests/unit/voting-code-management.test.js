import { describe, expect, it, vi } from 'vitest'
import { generateUniqueVotingCodes } from '../../src/domain/voting-access-code.js'
import { collectionDefinitions } from '../../src/repositories/indexes.js'
import { createVotingAccessCodeRepository } from '../../src/repositories/voting-access-code-repository.js'

const key = 'c'.repeat(64)
describe('voting code management', () => {
  it('generates exact bounded encrypted batches and checks persistence collisions', async () => {
    const exists = vi.fn().mockResolvedValueOnce(true).mockResolvedValue(false)
    const codes = await generateUniqueVotingCodes({ eventId: 'event-1', quantity: 3, key, exists })
    expect(codes).toHaveLength(3)
    expect(new Set(codes.map(({ code }) => code)).size).toBe(3)
    expect(codes.every(({ code, codeCiphertext }) => !codeCiphertext.includes(code))).toBe(true)
    expect(exists).toHaveBeenCalled()
  })
  it('rejects unsupported batches and defines terminal revoked state', async () => {
    await expect(generateUniqueVotingCodes({ eventId: 'event-1', quantity: 0, key, exists: async () => false }))
      .rejects.toThrow('1–1000')
    expect(collectionDefinitions.votingAccessCodes.validator.$jsonSchema.properties.status.enum)
      .toEqual(['unused', 'used', 'revoked'])
  })
  it('only consumes records still unused', async () => {
    const findOneAndUpdate = vi.fn().mockResolvedValue(null)
    const repository = createVotingAccessCodeRepository({ collection: () => ({ findOneAndUpdate }) })
    await repository.consume({ codeId: '64b000000000000000000001', accountId: '64b000000000000000000002',
      ballotId: '64b000000000000000000003', now: new Date() })
    expect(findOneAndUpdate.mock.calls[0][0]).toMatchObject({ status: 'unused' })
  })
})
