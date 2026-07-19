export const votingUsers = Object.freeze({
  host: { email: 'voting-host@example.test', password: 'password123', phone: '+14795550101' },
  voter: { email: 'voting-voter@example.test', password: 'password123', phone: '+14795550102' },
  incomplete: { email: 'voting-incomplete@example.test', password: 'password123' },
  provisional: { email: 'voting-provisional@example.test' },
})

export const votingEvent = Object.freeze({
  title: 'Voting rules E2E event',
  category: 'Finalists',
  entries: ['Entry one', 'Entry two', 'Entry three'],
})

export function votingWindow(now = Date.now()) {
  return {
    opensAt: new Date(now - 60_000).toISOString(),
    closesAt: new Date(now + 3_600_000).toISOString(),
  }
}
