export const eventWorkspacePaths = (publicId) => ({
  entries: `/events/${publicId}`,
  participants: `/events/${publicId}/participants`,
  results: `/events/${publicId}/results`,
  settings: `/events/${publicId}/settings`,
})

export const workspaceAnalytics = Object.freeze({ categoryCount: 3, participantCount: 5, entryCount: 8 })
