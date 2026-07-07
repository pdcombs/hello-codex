import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadOwnedEvents } from './events.graphql.js'

export default function EventDashboardPage({ viewer, events = null, loader = loadOwnedEvents }) {
  const [state, setState] = useState({
    status: events ? 'success' : 'loading',
    error: null,
    events: events ?? [],
  })

  useEffect(() => {
    if (events) return
    let active = true
    setState({ status: 'loading', error: null, events: [] })
    loader({ first: 20 })
      .then((result) => {
        if (!active) return
        setState({ status: 'success', error: null, events: result.events.nodes })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', error, events: [] })
      })
    return () => {
      active = false
    }
  }, [events, loader])

  return (
    <main className="page-shell">
      <p className="eyebrow">Welcome back{viewer?.email ? `, ${viewer.email}` : ''}</p>
      <h1>Your hosted events</h1>
      <p>Create and manage voting events from one place.</p>
      <div className="page-actions">
        <Link to="/events/new">Create event</Link>
      </div>

      {state.status === 'loading' && <p role="status">Loading your events…</p>}

      {state.status === 'error' && (
        <div role="alert">
          <p>{state.error.message}</p>
        </div>
      )}

      {state.status === 'success' && state.events.length === 0 && (
        <section aria-label="Empty events">
          <p>You have not created any voting events yet.</p>
          <Link to="/events/new">Create your first event</Link>
        </section>
      )}

      {state.status === 'success' && state.events.length > 0 && (
        <ul aria-label="Hosted events">
          {state.events.map((event) => (
            <li key={event.id}>
              <Link to={`/events/${event.publicId}`}>{event.title}</Link>
              <span>{` — ${labelForPolicy(event.registrationPolicy)}`}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function labelForPolicy(policy) {
  return policy === 'OPEN' ? 'Open registration' : 'Admin managed'
}
