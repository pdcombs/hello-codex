export const removalSnapshot = (event, category, entries = []) => ({
  eventId: String(event._id), categoryId: String(category._id),
  expectedEventUpdatedAt: event.updatedAt, expectedCategoryUpdatedAt: category.updatedAt,
  activeEntries: entries.map((entry) => ({ entryId: String(entry._id), expectedUpdatedAt: entry.updatedAt })),
})

export const activeCategory = (overrides = {}) => ({ status: 'active', archiveReason: null,
  archivedAt: null, archivedByAccountId: null, ...overrides })

export const archivedCategory = (overrides = {}) => ({ status: 'archived', archiveReason: 'category_removed',
  archivedAt: new Date('2026-07-19T13:00:00.000Z'), archivedByAccountId: 'owner-1', ...overrides })
