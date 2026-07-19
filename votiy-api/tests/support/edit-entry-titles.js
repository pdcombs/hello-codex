export const EDIT_ENTRY_TIMESTAMP = new Date('2026-07-19T12:00:00.000Z')

export function categorySnapshot(category, entries) {
  return {
    categoryId: String(category._id),
    title: category.title,
    expectedCategoryUpdatedAt: category.updatedAt,
    entryTitles: entries.map((entry) => ({ entryId: String(entry._id), title: entry.title,
      expectedUpdatedAt: entry.updatedAt })),
  }
}
