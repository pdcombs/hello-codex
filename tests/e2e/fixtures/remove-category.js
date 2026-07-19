const at = '2026-07-19T12:00:00.000Z'
export const removalCategories = Object.freeze([
  { id: 'category-populated', title: 'Desserts', isDefault: true, createdAt: at, updatedAt: at,
    entries: [{ id: 'entry-pie', title: 'Pie', ownerDisplayName: 'Peyton', updatedAt: at }] },
  { id: 'category-empty', title: 'Drinks', isDefault: false, createdAt: at, updatedAt: at, entries: [] },
])

export function removeCategoryScenario(overrides = {}) {
  return Object.freeze({ eventId: 'event-remove-category', updatedAt: at,
    categories: removalCategories, authorized: true, conflict: false, ...overrides })
}

export const populatedRemoval = () => removeCategoryScenario()
export const emptyRemoval = () => removeCategoryScenario({ categories: removalCategories.slice(1) })
export const finalCategoryRemoval = () => removeCategoryScenario({ categories: removalCategories.slice(0, 1) })
export const conflictingRemoval = () => removeCategoryScenario({ conflict: true })
export const unauthorizedRemoval = () => removeCategoryScenario({ authorized: false })
