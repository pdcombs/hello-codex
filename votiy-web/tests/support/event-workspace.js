export function eventWorkspace(overrides = {}) {
  return {
    id: 'event-1',
    publicId: 'public-1',
    title: 'Summer Showcase',
    description: 'Community favorites',
    location: 'Bentonville',
    registrationPolicy: 'ADMIN_MANAGED',
    isOwner: true,
    photo: null,
    analytics: { categoryCount: 2, participantCount: 3, entryCount: 4 },
    categories: [],
    ...overrides,
  }
}
