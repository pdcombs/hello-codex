import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField, FormSurface } from '../../components/Form.jsx'
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
    <main id="main-content" className="page-shell" tabIndex="-1">
      <p className="eyebrow">New voting event</p>
      <h1 data-page-title="true">Create an event</h1>
      <p>Start with a title, then choose how people get registered.</p>
      <FormSurface onSubmit={onSubmit} noValidate>
        <FormField label="Title" htmlFor="event-title" error={state.fieldErrors.title}>
          <input
            id="event-title"
            name="title"
            type="text"
            placeholder="Board election, budget vote, team poll"
            required
          />
        </FormField>

        <FormField label="Description" htmlFor="event-description" stacked>
          <textarea id="event-description" name="description" rows="4" placeholder="Add context voters should know." />
        </FormField>

        <FormField label="Location" htmlFor="event-location">
          <input id="event-location" name="location" type="text" placeholder="Remote, office, venue" />
        </FormField>

        <FormField label="Registration policy" htmlFor="event-policy">
          <select id="event-policy" name="registrationPolicy" defaultValue="ADMIN_MANAGED">
            <option value="ADMIN_MANAGED">Admin managed</option>
            <option value="OPEN">Open</option>
          </select>
        </FormField>

        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Creating event…' : 'Create event'}
        </button>
      </FormSurface>

      {state.status === 'loading' && (
        <p className="form-status" role="status">
          Creating your event…
        </p>
      )}
      {state.status === 'error' && (
        <p className="form-error" role="alert">
          {state.error.message}
        </p>
      )}
    </main>
  )
}

function optionalValue(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized === '' ? null : normalized
}
