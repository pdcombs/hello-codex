import { votingAccessText, votingMethodText, votingWindow } from './event-voting-summary.js'
import VotingStatusControl from '../voting/VotingStatusControl.jsx'

export default function EventVotingSummary({ event, onChanged }) {
  const rules = event.detailAccess === 'PRIVATE_SUMMARY' ? null : event.voting?.rules
  if (!rules) return null
  const window = votingWindow(rules)
  const access = votingAccessText(rules.accessPolicy, event.isOwner)
  const method = votingMethodText(rules.defaultCategoryRule, event.isOwner)
  return <aside className="event-voting-summary" aria-label="Voting information">
    <div className="event-voting-summary-copy">
      {event.votingState?.status !== 'OPEN' && <p className="voting-closed-message">Voting is closed at this time.</p>}
      {window && <p className="event-voting-window">
        Voting opens <time dateTime={window.opensAt}>{window.opensText}</time> and closes{' '}
        <time dateTime={window.closesAt}>{window.closesText}</time>.
      </p>}
      {access && <p>{access}</p>}
      {method && <p>{method}</p>}
    </div>
    {event.isOwner && <VotingStatusControl event={event} onSaved={onChanged} />}
  </aside>
}
