import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEvent } from './events.graphql.js'

export default function CreateEventPage({ create = createEvent }) {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'idle', error: null, fieldErrors: {} })

  async function onSubmit(event) {
    event.preventDefault()
    if (state.status === 'loading') return

    const form = new FormData(event.currentTarget)
    setState({ status: 'loading', error: null, fieldErrors: {} })

    try {
      const result = await create({
        title: form.get('title'),
        description: optionalValue(form.get('description')),
        location: optionalValue(form.get('location')),
        registrationPolicy: form.get('registrationPolicy'),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-event`,
      })
      navigate(`/events/${result.event.publicId}`, { replace: true })
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message]))
      setState({ status: 'error', error, fieldErrors })
    }
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">New voting event</p>
      <h1>Create an event</h1>
      <p>Start with a title, then choose how people get registered.</p>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="event-title">Title</label>
        <input id="event-title" name="title" type="text" required aria-describedby={state.fieldErrors.title ? 'event-title-error' : undefined} />
        {state.fieldErrors.title && <p id="event-title-error">{state.fieldErrors.title}</p>}

        <label htmlFor="event-description">Description</label>
        <textarea id="event-description" name="description" rows="4" />

        <label htmlFor="event-location">Location</label>
        <input id="event-location" name="location" type="text" />

        <label htmlFor="event-policy">Registration policy</label>
        <select id="event-policy" name="registrationPolicy" defaultValue="ADMIN_MANAGED">
          <option value="ADMIN_MANAGED">Admin managed</option>
          <option value="OPEN">Open</option>
        </select>

        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Creating event…' : 'Create event'}
        </button>
      </form>

      {state.status === 'loading' && <p role="status">Creating your event…</p>}
      {state.status === 'error' && <p role="alert">{state.error.message}</p>}
    </main>
  )
}

function optionalValue(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized === '' ? null : normalized
}
