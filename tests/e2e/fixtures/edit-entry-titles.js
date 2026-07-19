export const editEntryTitlesEvent = Object.freeze({
  id: 'event-edit-titles', publicId: 'edit-titles', title: 'Edit titles event', isOwner: true,
  categories: [{ id: 'category-edit-titles', title: 'Desserts', isDefault: true,
    createdAt: '2026-07-19T12:00:00.000Z', updatedAt: '2026-07-19T12:00:00.000Z', entries: [
      { id: 'entry-pie', title: 'Pie', categoryId: 'category-edit-titles', ownerAccountId: 'account-peyton',
        ownerDisplayName: 'Peyton', status: 'ACTIVE', createdAt: '2026-07-19T12:00:00.000Z',
        updatedAt: '2026-07-19T12:00:00.000Z' },
      { id: 'entry-cake', title: 'Cake', categoryId: 'category-edit-titles', ownerAccountId: 'account-alex',
        ownerDisplayName: 'Alex', status: 'ACTIVE', createdAt: '2026-07-19T12:00:00.000Z',
        updatedAt: '2026-07-19T12:00:00.000Z' },
    ] }],
})
