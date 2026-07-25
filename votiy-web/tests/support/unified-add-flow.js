export const defaultCategory = {
  id: 'category-default',
  title: 'Showcase participants',
  isDefault: true,
  entries: [],
}

export const alternateCategory = {
  id: 'category-alternate',
  title: 'Desserts',
  isDefault: false,
  entries: [],
}

export const ownerChoice = {
  accountId: 'account-1',
  displayName: 'Peyton Person',
  email: 'peyton@example.test',
  phone: null,
  isEventParticipant: true,
}

export function unifiedAddEvent(overrides = {}) {
  return {
    id: 'event-1',
    publicId: 'showcase',
    title: 'Showcase',
    description: null,
    location: null,
    isOwner: true,
    analytics: { categoryCount: 2, participantCount: 0, entryCount: 0 },
    categories: [alternateCategory, defaultCategory],
    ...overrides,
  }
}
