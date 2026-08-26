import { useEffect, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'

const initialForm = (event) => ({
  title: event.title ?? '', description: event.description ?? '', location: event.location ?? '',
})

export default function EventDetailsEditor({ event, saver, onSaved }) {
  const [form, setForm] = useState(() => initialForm(event))
  const [state, setState] = useState({ saving: false, error: null, fieldErrors: {}, saved: false })
  const archived = event.lifecycleStatus === 'ARCHIVED'
  useEffect(() => { setForm(initialForm(event)) }, [event])

  async function submit(submitEvent) {
    submitEvent.preventDefault()
    const title = form.title.trim()
    const errors = {}
    if (!title) errors.title = 'Title is required.'
    if (title.length > 120) errors.title = 'Title must be 120 characters or fewer.'
    if (form.description.trim().length > 2000) errors.description = 'Description must be 2000 characters or fewer.'
    if (form.location.trim().length > 300) errors.location = 'Location must be 300 characters or fewer.'
    if (Object.keys(errors).length) { setState({ saving: false, error: null, fieldErrors: errors, saved: false }); return }
    setState({ saving: true, error: null, fieldErrors: {}, saved: false })
    try {
      const result = await saver({ eventId: event.id, title,
        description: form.description.trim() || null, location: form.location.trim() || null,
        expectedUpdatedAt: event.updatedAt })
      setState({ saving: false, error: null, fieldErrors: {}, saved: true })
      await onSaved(result.event)
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message]))
      setState({ saving: false, error, fieldErrors, saved: false })
    }
  }

  return <section className="section-card event-details-settings" aria-labelledby="event-details-title">
    <h2 id="event-details-title">Event details</h2>
    {archived && <p>This event is archived and read-only.</p>}
    <FormSurface onSubmit={submit} noValidate>
      <FormField label="Title" htmlFor="settings-event-title" error={state.fieldErrors.title}>
        <input id="settings-event-title" value={form.title} maxLength="120" required disabled={archived}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </FormField>
      <FormField label="Description" htmlFor="settings-event-description" optional stacked
        error={state.fieldErrors.description}>
        <textarea id="settings-event-description" value={form.description} maxLength="2000" rows="4"
          disabled={archived} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </FormField>
      <FormField label="Location" htmlFor="settings-event-location" optional error={state.fieldErrors.location}>
        <input id="settings-event-location" value={form.location} maxLength="300" disabled={archived}
          onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </FormField>
      {state.error && <p role="alert">{state.error.code === 'CONFLICT'
        ? 'Event changed or was archived. Reload and try again.' : state.error.message}</p>}
      {state.saved && <p role="status">Event details saved.</p>}
      {!archived && <button type="submit" className="primary-action" disabled={state.saving}>
        {state.saving ? 'Saving…' : 'Save event details'}
      </button>}
    </FormSurface>
  </section>
}
