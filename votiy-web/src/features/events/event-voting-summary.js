const ACCESS_TEXT = Object.freeze({
  CODE: { host: 'Voters need a code to vote.', public: 'This event requires a registered code to vote.' },
  ACCOUNT: { host: 'Voters need a completed account to vote.', public: 'You need a completed account to vote in this event.' },
  UNRESTRICTED: { host: 'Anyone with the event link can vote.', public: 'Anyone with this event link can vote.' },
})

export function votingAccessText(policy, owner) {
  return ACCESS_TEXT[policy]?.[owner ? 'host' : 'public'] ?? null
}

export function votingMethodText(rule, owner) {
  if (!rule) return null
  if (rule.method === 'SINGLE') return owner
    ? 'Voters choose one entry in each category.' : 'Choose one entry in each category.'
  if (rule.method === 'RANKING') return owner
    ? 'Voters rank all entries in each category.' : 'Rank all entries in each category.'
  if (rule.method === 'MULTIPLE' && Number.isInteger(rule.minimumSelections)
    && Number.isInteger(rule.maximumSelections)) {
    const action = owner ? 'Voters choose' : 'Choose'
    return `${action} ${rule.minimumSelections}–${rule.maximumSelections} entries in each category.`
  }
  return null
}

export function votingWindow(rules, locale = undefined) {
  if (!rules?.opensAt || !rules?.closesAt) return null
  const opensAt = new Date(rules.opensAt); const closesAt = new Date(rules.closesAt)
  if (Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime())) return null
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
  return { opensAt: opensAt.toISOString(), closesAt: closesAt.toISOString(),
    opensText: formatter.format(opensAt), closesText: formatter.format(closesAt) }
}
