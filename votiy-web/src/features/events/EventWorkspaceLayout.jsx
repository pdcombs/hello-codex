import EventWorkspaceSummary from './EventWorkspaceSummary.jsx'
import EventWorkspaceTabs from './EventWorkspaceTabs.jsx'

export default function EventWorkspaceLayout({ event, onChanged, children }) {
  return <>
    <EventWorkspaceSummary event={event} onChanged={onChanged} />
    <EventWorkspaceTabs publicId={event.publicId} />
    <section className="event-workspace-content" aria-live="polite">{children}</section>
  </>
}
