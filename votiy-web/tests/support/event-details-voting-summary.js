export const votingSummaryRules = Object.freeze({
  opensAt: '2030-01-01T12:00:00.000Z', closesAt: '2030-01-01T14:00:00.000Z', accessPolicy: 'CODE',
  defaultCategoryRule: { method: 'SINGLE', minimumSelections: null, maximumSelections: null },
})

export function feature011Event(role = 'public') {
  if (role === 'private') return { publicId: 'private', title: 'Private', detailAccess: 'PRIVATE_SUMMARY',
    isOwner: false, voting: null }
  return { id: 'event-1', publicId: 'public', title: 'Awards', description: 'Annual', location: 'Hall',
    detailAccess: 'FULL', isOwner: role === 'host', voting: { rules: votingSummaryRules } }
}
