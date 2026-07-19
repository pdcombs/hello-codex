import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { configureVotingRules, createDraftVotingRules, effectiveCategoryRule } from '../../src/domain/event-voting-rules.js'

const ownerAccountId = new ObjectId(); const categoryId = new ObjectId()
const base = { ownerAccountId, now: new Date('2030-01-01T10:00:00Z') }
const input = {
  expectedRulesVersion: 1, opensAt: '2030-01-01T12:00:00Z', closesAt: '2030-01-01T14:00:00Z',
  accessPolicy: 'UNRESTRICTED', unrestrictedRepeatPolicy: 'UNLIMITED', maximumBallotsPerAccount: null,
  codeRequiresCompletedAccount: null,
  defaultCategoryRule: { categoryId: String(categoryId), method: 'SINGLE', minimumSelections: null, maximumSelections: null },
  categoryRules: [],
}

describe('event voting rules', () => {
  it('starts closed and increments configured versions', () => {
    const draft = createDraftVotingRules(base)
    expect(draft).toMatchObject({ status: 'draft', opensAt: null, closesAt: null, version: 1 })
    expect(configureVotingRules(draft, input, { ...base, categoryIds: [categoryId] }))
      .toMatchObject({ status: 'configured', version: 2, accessPolicy: 'unrestricted' })
  })

  it('rejects stale version and inverted window', () => {
    const draft = createDraftVotingRules(base)
    expect(() => configureVotingRules(draft, { ...input, expectedRulesVersion: 2 }, { ...base, categoryIds: [categoryId] }))
      .toThrow('RULES_CHANGED')
    expect(() => configureVotingRules(draft, { ...input, closesAt: input.opensAt }, { ...base, categoryIds: [categoryId] }))
      .toThrow('opening must be before closing')
  })

  it('validates multiple bounds and resolves category overrides', () => {
    const draft = createDraftVotingRules(base)
    const configured = configureVotingRules(draft, { ...input, categoryRules: [{ categoryId: String(categoryId),
      method: 'MULTIPLE', minimumSelections: 1, maximumSelections: 2 }] }, { ...base, categoryIds: [categoryId] })
    expect(effectiveCategoryRule(configured, categoryId)).toMatchObject({ method: 'multiple', multipleMin: 1, multipleMax: 2 })
  })

  it('rejects invalid policies, methods, bounds, and category overrides', () => {
    const draft = createDraftVotingRules(base); const configure = (changes) => configureVotingRules(draft,
      { ...input, ...changes }, { ...base, categoryIds: [categoryId] })
    expect(() => configure({ accessPolicy: 'UNKNOWN' })).toThrow('Access policy')
    expect(() => configure({ defaultCategoryRule: { method: 'UNKNOWN' } })).toThrow('method is invalid')
    expect(() => configure({ defaultCategoryRule: { method: 'SINGLE', minimumSelections: 1, maximumSelections: 1 } }))
      .toThrow('bounds require multiple')
    expect(() => configure({ defaultCategoryRule: { method: 'MULTIPLE', minimumSelections: -1, maximumSelections: 1 } }))
      .toThrow('minimumSelections')
    expect(() => configure({ defaultCategoryRule: { method: 'MULTIPLE', minimumSelections: 2, maximumSelections: 1 } }))
      .toThrow('maximumSelections')
    expect(() => configure({ categoryRules: [{ categoryId: String(new ObjectId()), method: 'SINGLE' }] }))
      .toThrow('Category rule is invalid')
    expect(() => configure({ categoryRules: [{ categoryId: String(categoryId), method: 'SINGLE' },
      { categoryId: String(categoryId), method: 'SINGLE' }] })).toThrow('Category rule is invalid')
  })

  it('normalizes account and code policy limits', () => {
    const draft = createDraftVotingRules(base)
    expect(configureVotingRules(draft, { ...input, accessPolicy: 'ACCOUNT', unrestrictedRepeatPolicy: null,
      maximumBallotsPerAccount: 3 }, { ...base, categoryIds: [categoryId] }))
      .toMatchObject({ accessPolicy: 'account', maxBallotsPerAccount: 3, unrestrictedRepeatPolicy: null })
    expect(configureVotingRules(draft, { ...input, accessPolicy: 'CODE', unrestrictedRepeatPolicy: null,
      codeRequiresCompletedAccount: false }, { ...base, categoryIds: [categoryId] }))
      .toMatchObject({ accessPolicy: 'code', maxBallotsPerAccount: null, codeRequiresCompletedAccount: false })
  })
})
