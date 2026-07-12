export function syntheticParticipant(suffix = Date.now().toString(36)) {
  return {
    displayName: `Participant ${suffix}`,
    email: `participant-${suffix}@example.test`,
    entries: [{ title: `Entry ${suffix}` }],
  }
}
