import { Link } from 'react-router-dom'

export default function EventDashboardPage({ viewer, events = [] }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">Welcome back{viewer?.email ? `, ${viewer.email}` : ''}</p>
      <h1>Your hosted events</h1>
      {events.length === 0 ? (
        <>
          <p>You have not created any voting events yet.</p>
          <Link to="/events/new">Create your first event</Link>
        </>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <Link to={`/events/${event.publicId}`}>{event.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
