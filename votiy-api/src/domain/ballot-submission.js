import { ObjectId } from 'mongodb'
import { effectiveCategoryRule } from './event-voting-rules.js'

export function votingWindowStatus(rules, now = new Date()) {
  if (!rules || rules.status !== 'configured') return 'NOT_CONFIGURED'
  if (now < rules.opensAt) return 'UPCOMING'
  if (now >= rules.closesAt) return 'CLOSED'
  return 'OPEN'
}

export function validateCategoryBallots({ event, entries, categoryBallots }) {
  const activeCategories = event.categories.filter(({ status }) => status !== 'archived')
  const entriesByCategory = new Map(activeCategories.map(({ _id }) => [String(_id), []]))
  for (const entry of entries.filter(({ status }) => status !== 'archived')) entriesByCategory.get(String(entry.categoryId))?.push(entry)
  const submitted = new Map(categoryBallots.map((ballot) => [String(ballot.categoryId), ballot]))
  if (submitted.size !== categoryBallots.length) throw new TypeError('Duplicate category ballot')
  const normalized = []
  for (const category of activeCategories) {
    const available = entriesByCategory.get(String(category._id)) ?? []
    if (available.length === 0) continue
    const ballot = submitted.get(String(category._id)); if (!ballot) throw new TypeError('Missing category ballot')
    const ids = ballot.entryIds.map(String); const unique = new Set(ids)
    if (unique.size !== ids.length || ids.some((value) => !available.some(({ _id }) => String(_id) === value))) {
      throw new TypeError('Ballot contains invalid entries')
    }
    const rule = effectiveCategoryRule(event.votingRules, category._id)
    if (rule.method === 'single' && ids.length !== 1) throw new TypeError('Select exactly one entry')
    if (rule.method === 'multiple' && (ids.length < rule.multipleMin || ids.length > rule.multipleMax)) {
      throw new TypeError('Selection count is outside allowed range')
    }
    if (rule.method === 'ranking' && ids.length !== available.length) throw new TypeError('Rank every entry')
    normalized.push({ categoryId: new ObjectId(category._id), method: rule.method, entryIds: ids.map((value) => new ObjectId(value)) })
  }
  if (submitted.size !== normalized.length) throw new TypeError('Unknown or empty category ballot')
  return normalized
}
