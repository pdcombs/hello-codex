import { Link } from 'react-router-dom'
import EventAnalytics from './EventAnalytics.jsx'
import EventPhoto from './EventPhoto.jsx'
import EventVotingSummary from './EventVotingSummary.jsx'

export default function EventWorkspaceSummary({ event, onChanged, onAdd }) {
  return <section className="event-workspace-summary" aria-labelledby="event-workspace-title">
    <div className="event-workspace-topline">
      <EventPhoto event={event} owner={event.isOwner} onChanged={onChanged} />
      <EventAnalytics analytics={event.analytics} />
      {event.isOwner && <div className="event-workspace-actions">
        <button className="primary-action" type="button" onClick={onAdd}>Add</button>
        <Link className="settings-action" to={`/events/${event.publicId}/settings`}
          aria-label="Event settings">⚙</Link>
      </div>}
    </div>
    <h1 id="event-workspace-title" data-page-title="true" tabIndex="-1">{event.title}</h1>
    {event.description && <p className="event-description">{event.description}</p>}
    {event.location && <p className="event-location">{event.location}</p>}
    <EventVotingSummary event={event} />
  </section>
}
