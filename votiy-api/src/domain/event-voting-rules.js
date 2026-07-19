import { ObjectId } from 'mongodb'

const METHODS = new Set(['single', 'multiple', 'ranking'])
const POLICIES = new Set(['unrestricted', 'account', 'code'])

export function createDraftVotingRules({ ownerAccountId, now = new Date() }) {
  return Object.freeze({
    status: 'draft', version: 1, opensAt: null, closesAt: null,
    accessPolicy: 'unrestricted', unrestrictedRepeatPolicy: 'unlimited',
    maxBallotsPerAccount: null, codeRequiresCompletedAccount: null,
    defaultCategoryMethod: 'single', defaultMultipleMin: null, defaultMultipleMax: null,
    categoryOverrides: [],
    updatedByAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId),
    createdAt: now, updatedAt: now,
  })
}

function validateMethod({ method, minimumSelections, maximumSelections }, field = 'defaultCategoryRule') {
  const normalizedMethod = method.toLowerCase()
  if (!METHODS.has(normalizedMethod)) throw new TypeError(`${field}.method is invalid`)
  if (normalizedMethod !== 'multiple') {
    if (minimumSelections != null || maximumSelections != null) throw new TypeError(`${field} bounds require multiple method`)
    return
  }
  if (!Number.isInteger(minimumSelections) || minimumSelections < 0) throw new TypeError(`${field}.minimumSelections is invalid`)
  if (!Number.isInteger(maximumSelections) || maximumSelections < 1 || maximumSelections < minimumSelections) {
    throw new TypeError(`${field}.maximumSelections is invalid`)
  }
}

export function configureVotingRules(current, input, { ownerAccountId, categoryIds, now = new Date() }) {
  if (input.expectedRulesVersion !== current.version) throw new Error('RULES_CHANGED')
  const opensAt = new Date(input.opensAt); const closesAt = new Date(input.closesAt)
  if (!(opensAt < closesAt)) throw new TypeError('Voting opening must be before closing')
  const accessPolicy = input.accessPolicy.toLowerCase()
  if (!POLICIES.has(accessPolicy)) throw new TypeError('Access policy is invalid')
  const defaultRule = input.defaultCategoryRule
  validateMethod(defaultRule)
  const known = new Set(categoryIds.map(String)); const seen = new Set()
  const categoryOverrides = input.categoryRules.map((rule) => {
    if (!known.has(String(rule.categoryId)) || seen.has(String(rule.categoryId))) throw new TypeError('Category rule is invalid')
    seen.add(String(rule.categoryId)); validateMethod(rule, 'categoryRules')
    return { categoryId: new ObjectId(rule.categoryId), method: rule.method.toLowerCase(),
      multipleMin: rule.minimumSelections ?? null, multipleMax: rule.maximumSelections ?? null }
  })
  return Object.freeze({
    status: 'configured', version: current.version + 1, opensAt, closesAt, accessPolicy,
    unrestrictedRepeatPolicy: accessPolicy === 'unrestricted' ? input.unrestrictedRepeatPolicy.toLowerCase() : null,
    maxBallotsPerAccount: accessPolicy === 'account' || (accessPolicy === 'code' && input.codeRequiresCompletedAccount)
      ? input.maximumBallotsPerAccount : null,
    codeRequiresCompletedAccount: accessPolicy === 'code' ? Boolean(input.codeRequiresCompletedAccount) : null,
    defaultCategoryMethod: defaultRule.method.toLowerCase(),
    defaultMultipleMin: defaultRule.minimumSelections ?? null,
    defaultMultipleMax: defaultRule.maximumSelections ?? null,
    categoryOverrides, updatedByAccountId: new ObjectId(ownerAccountId), createdAt: current.createdAt, updatedAt: now,
  })
}

export function effectiveCategoryRule(rules, categoryId) {
  const override = rules.categoryOverrides.find((rule) => String(rule.categoryId) === String(categoryId))
  return override ?? { categoryId, method: rules.defaultCategoryMethod,
    multipleMin: rules.defaultMultipleMin, multipleMax: rules.defaultMultipleMax }
}
