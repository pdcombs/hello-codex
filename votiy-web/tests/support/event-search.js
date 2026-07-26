export const searchDialogFixtures = Object.freeze({
  queries: ['motorcycle show in rogers ar', 'bbq competition in kansas city', 'talent show in bentonville'],
  firstPage: { nodes: [{ publicId: 'event-1', title: 'Motorcycle Show', description: 'Bikes', location: 'Rogers AR',
    visibility: 'PUBLIC' }], nextCursor: null },
  privatePage: { nodes: [{ publicId: 'private-1', title: 'Private Show', description: 'Invite event',
    location: null, visibility: 'PRIVATE' }], nextCursor: null },
})
