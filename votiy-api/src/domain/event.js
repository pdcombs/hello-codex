import { ObjectId } from 'mongodb'
import { createCategory } from './event-category.js'
import { toCategoryView } from './event-category.js'
import { isActiveCategory } from './event-category.js'
import { createDraftVotingRules } from './event-voting-rules.js'

const REGISTRATION_POLICIES = new Set(['admin_managed', 'open'])

export function createEventDocument({
  ownerAccountId,
  publicId,
  title,
  description = null,
  location = null,
  registrationPolicy = 'admin_managed',
  now = new Date(),
}) {
  if (
    !ownerAccountId ||
    !publicId ||
    !title ||
    !REGISTRATION_POLICIES.has(registrationPolicy)
  ) throw new TypeError('Invalid event')

  return Object.freeze({
    _id: new ObjectId(),
    ownerAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId),
    publicId,
    title,
    description,
    location,
    registrationPolicy,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  })
}

export function withEventVersion2(event, { categoryId = new ObjectId(), now = event.updatedAt ?? new Date() } = {}) {
  const category = createCategory({ id: categoryId, title: `${event.title.trim()} participants`, isDefault: true, now })
  return Object.freeze({ ...event, categories: [category], schemaVersion: 2, updatedAt: now })
}

export function withEventVersion3(event, options = {}) {
  const version2 = event.schemaVersion === 2 ? event : withEventVersion2(event, options)
  return Object.freeze({ ...version2,
    votingRules: createDraftVotingRules({ ownerAccountId: version2.ownerAccountId, now: options.now ?? version2.updatedAt }),
    schemaVersion: 3 })
}

export function toEventView(event, viewerAccountId = null) {
  const ownerId = String(event.ownerAccountId)
  const rules = event.votingRules ?? null
  const currentTime = Date.now()
  const votingStatus = !rules || rules.status === 'draft' ? 'NOT_CONFIGURED'
    : currentTime < rules.opensAt.getTime() ? 'UPCOMING'
      : currentTime >= rules.closesAt.getTime() ? 'CLOSED' : 'OPEN'
  const ruleView = rules ? {
    status: rules.status.toUpperCase(), version: rules.version, opensAt: rules.opensAt, closesAt: rules.closesAt,
    accessPolicy: rules.accessPolicy.toUpperCase(),
    unrestrictedRepeatPolicy: rules.unrestrictedRepeatPolicy?.toUpperCase() ?? null,
    maximumBallotsPerAccount: rules.maxBallotsPerAccount,
    codeRequiresCompletedAccount: rules.codeRequiresCompletedAccount,
    defaultCategoryRule: { categoryId: null, method: rules.defaultCategoryMethod.toUpperCase(),
      minimumSelections: rules.defaultMultipleMin, maximumSelections: rules.defaultMultipleMax },
    categoryRules: rules.categoryOverrides.map((rule) => ({ categoryId: String(rule.categoryId),
      method: rule.method.toUpperCase(), minimumSelections: rule.multipleMin, maximumSelections: rule.multipleMax })),
    updatedAt: rules.updatedAt,
  } : null
  return Object.freeze({
    id: String(event._id),
    publicId: event.publicId,
    title: event.title,
    description: event.description,
    location: event.location,
    registrationPolicy: event.registrationPolicy === 'open' ? 'OPEN' : 'ADMIN_MANAGED',
    isOwner: viewerAccountId ? String(viewerAccountId) === ownerId : false,
    categories: (event.categories ?? []).filter(isActiveCategory).map((category) => toCategoryView(category)),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    voting: ruleView ? { votingStatus, canVote: votingStatus === 'OPEN', reasonCode: votingStatus === 'OPEN' ? null : votingStatus,
      remainingBallots: null, hasEventAccess: rules.accessPolicy === 'unrestricted', rules: ruleView } : null,
  })
}
