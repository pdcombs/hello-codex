import { describe, expect, it } from 'vitest'
import {
  decryptVotingCode, digestVotingCode, encryptVotingCode, generateUniqueVotingCodes, generateVotingCode,
} from '../../src/domain/voting-access-code.js'

const key = 'a'.repeat(64)

describe('voting access code security', () => {
  it('generates six lowercase alphanumeric characters', () => {
    expect(generateVotingCode(() => Buffer.from([0, 1, 2, 25, 26, 35]))).toMatch(/^[a-z0-9]{6}$/)
  })

  it('binds digest to event and round-trips authenticated ciphertext', () => {
    const encrypted = encryptVotingCode({ code: 'abc123', key })
    expect(encrypted.codeCiphertext).not.toContain('abc123')
    expect(decryptVotingCode({ ...encrypted, key })).toBe('abc123')
    expect(digestVotingCode({ eventId: 'one', code: 'abc123', key }))
      .not.toBe(digestVotingCode({ eventId: 'two', code: 'abc123', key }))
  })

  it('rejects invalid keys and quantities', async () => {
    expect(() => encryptVotingCode({ code: 'abc123', key: 'bad' })).toThrow('32 bytes')
    await expect(generateUniqueVotingCodes({ eventId: 'one', quantity: 1001, key, exists: async () => false }))
      .rejects.toThrow('1–1000')
  })
})
