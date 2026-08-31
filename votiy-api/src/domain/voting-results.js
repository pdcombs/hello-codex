import { effectiveCategoryRule } from './event-voting-rules.js'

const key = (value) => String(value)
const titleCompare = (left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })

export function calculateVotingResults({ event, entries = [], ballots = [], calculatedAt = new Date() }) {
  const categories = new Map()
  for (const [categoryOrder, category] of (event.categories ?? []).entries()) {
    categories.set(key(category._id), { categoryId: key(category._id), categoryTitle: category.title,
      categoryOrder, method: effectiveCategoryRule(event.votingRules, category._id).method,
      contributingBallots: 0, entries: new Map() })
  }
  const entryOrderByCategory = new Map()
  for (const entry of entries) {
    const categoryId = key(entry.categoryId)
    const category = categories.get(categoryId)
    if (!category) continue
    const order = entryOrderByCategory.get(categoryId) ?? 0
    entryOrderByCategory.set(categoryId, order + 1)
    category.entries.set(key(entry._id), { entryId: key(entry._id), entryTitle: entry.title,
      entryOrder: order, total: 0 })
  }

  for (const ballot of ballots) for (const categoryBallot of ballot.categoryBallots ?? []) {
    const categoryId = key(categoryBallot.categoryId)
    let category = categories.get(categoryId)
    if (!category) {
      category = { categoryId, categoryTitle: categoryBallot.categoryTitle ?? 'Unavailable category',
        categoryOrder: categoryBallot.categoryOrder ?? categories.size,
        method: categoryBallot.method, contributingBallots: 0, entries: new Map() }
      categories.set(categoryId, category)
    }
    const choices = categoryBallot.entries ?? (categoryBallot.entryIds ?? []).map((entryId, selectionOrder) => ({
      entryId, entryTitle: 'Unavailable entry', selectionOrder,
    }))
    category.method = categoryBallot.method ?? category.method
    category.contributingBallots += 1
    for (const [choiceIndex, choice] of choices.entries()) {
      const entryId = key(choice.entryId)
      let result = category.entries.get(entryId)
      if (!result) {
        result = { entryId, entryTitle: choice.entryTitle ?? 'Unavailable entry',
          entryOrder: Number.MAX_SAFE_INTEGER, total: 0 }
        category.entries.set(entryId, result)
      }
      const position = (choice.selectionOrder ?? choiceIndex) + 1
      result.total += category.method === 'ranking' ? Math.max(0, choices.length - position) : 1
    }
  }

  const categoryResults = [...categories.values()].sort((left, right) => left.categoryOrder - right.categoryOrder
    || titleCompare(left.categoryTitle, right.categoryTitle)).map((category) => {
    const rows = [...category.entries.values()]
    const maximum = rows.length ? Math.max(...rows.map(({ total }) => total)) : 0
    const hasWinner = category.contributingBallots > 0 && (maximum > 0 || category.method === 'ranking' && rows.length === 1)
    return { categoryId: category.categoryId, categoryTitle: category.categoryTitle,
      categoryOrder: category.categoryOrder, method: category.method.toUpperCase(),
      contributingBallots: category.contributingBallots,
      entries: rows.map((entry) => ({ ...entry, winner: hasWinner && entry.total === maximum }))
        .sort((left, right) => right.total - left.total || left.entryOrder - right.entryOrder
          || titleCompare(left.entryTitle, right.entryTitle)) }
  })
  return Object.freeze({ votesReceived: ballots.length, calculatedAt, categories: categoryResults })
}
