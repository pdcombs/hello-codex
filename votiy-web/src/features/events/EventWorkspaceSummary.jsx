import { Link } from 'react-router-dom'
import EventAnalytics from './EventAnalytics.jsx'
import EventPhoto from './EventPhoto.jsx'
import EventVotingSummary from './EventVotingSummary.jsx'
import VotingAccessButton from '../voting/VotingAccessButton.jsx'

export default function EventWorkspaceSummary({ event, onChanged, onAdd }) {
  return <section className="event-workspace-summary" aria-labelledby="event-workspace-title">
    {event.votingState?.status === 'OPEN' && <div className="voting-open-banner" role="status">Voting is now open</div>}
    <div className="event-workspace-topline">
      <EventPhoto event={event} owner={event.isOwner} onChanged={onChanged} />
      <EventAnalytics analytics={event.analytics} />
      {(event.isOwner || event.votingState?.status === 'OPEN') && <div className="event-workspace-actions">
        {event.votingState?.status === 'OPEN' && <VotingAccessButton event={event} />}
        {event.isOwner && <><button className="primary-action" type="button" onClick={onAdd}>Add</button>
          <Link className="settings-action" to={`/events/${event.publicId}/settings`}
            aria-label="Event settings">⚙</Link></>}
      </div>}
    </div>
    <h1 id="event-workspace-title" data-page-title="true" tabIndex="-1">{event.title}</h1>
    {event.description && <p className="event-description">{event.description}</p>}
    {event.location && <p className="event-location">{event.location}</p>}
    <EventVotingSummary event={event} />
  </section>
}
