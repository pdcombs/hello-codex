import { votingAccessText, votingMethodText, votingWindow } from './event-voting-summary.js'

export default function EventVotingSummary({ event }) {
  const rules = event.detailAccess === 'PRIVATE_SUMMARY' ? null : event.voting?.rules
  if (!rules) return null
  const window = votingWindow(rules)
  const access = votingAccessText(rules.accessPolicy, event.isOwner)
  const method = votingMethodText(rules.defaultCategoryRule, event.isOwner)
  return <aside className="event-voting-summary" aria-label="Voting information">
    {window && <p className="event-voting-window">
      Voting opens <time dateTime={window.opensAt}>{window.opensText}</time> and closes{' '}
      <time dateTime={window.closesAt}>{window.closesText}</time>.
    </p>}
    {access && <p>{access}</p>}
    {method && <p>{method}</p>}
  </aside>
}
