export function deriveEventAnalytics(event, entries = []) {
  const activeCategoryIds = new Set(
    (event.categories ?? []).filter((category) => category.status !== 'archived').map((category) => String(category._id)),
  )
  const activeEntries = entries.filter((entry) =>
    entry.status !== 'archived' && activeCategoryIds.has(String(entry.categoryId)),
  )
  return Object.freeze({
    categoryCount: activeCategoryIds.size,
    entryCount: activeEntries.length,
    participantCount: new Set(activeEntries.map((entry) => String(entry.ownerAccountId))).size,
  })
}
