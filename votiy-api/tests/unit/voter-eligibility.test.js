import { describe, expect, it } from 'vitest'
import { accountIsVotingComplete, assertAccountEligibility, browserMarkerRequired,
  codeAccountRequired, provisionalContact } from '../../src/domain/voter-eligibility.js'

describe('voter eligibility matrix', () => {
  const account = { emailNormalized: 'voter@example.test', phoneNormalized: '+14795550101' }
  it('requires email/phone and enforces account ballot limit', () => {
    expect(accountIsVotingComplete(account)).toBe(true)
    expect(() => assertAccountEligibility({ rules: { maxBallotsPerAccount: 1 }, account: { ...account, phoneNormalized: null } }))
      .toThrow('Complete required account details')
    expect(() => assertAccountEligibility({ rules: { maxBallotsPerAccount: 1 }, account, ballotCount: 1 }))
      .toThrow('reached its ballot limit')
  })
  it('distinguishes unlimited/browser and optional/required code accounts', () => {
    expect(browserMarkerRequired({ accessPolicy: 'unrestricted', unrestrictedRepeatPolicy: 'browser_limited' })).toBe(true)
    expect(codeAccountRequired({ accessPolicy: 'code', codeRequiresCompletedAccount: true })).toBe(true)
  })
  it('normalizes provisional email and requires valid contact', () => {
    expect(provisionalContact({ email: ' Peyton@Example.Test ' })).toMatchObject({
      emailNormalized: 'peyton@example.test', displayName: 'peyton', phoneNormalized: null })
    expect(() => provisionalContact({ email: 'bad' })).toThrow('Complete required account details')
  })
})
