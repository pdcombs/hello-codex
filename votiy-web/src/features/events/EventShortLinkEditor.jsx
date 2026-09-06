import { useEffect, useState } from 'react'
import { updateEventShortId } from './events.graphql.js'

export default function EventShortLinkEditor({ event, saver = updateEventShortId, onSaved }) {
  const [shortId, setShortId] = useState(event.shortId ?? event.publicId)
  const [state, setState] = useState({ saving: false, error: null, saved: false })
  useEffect(() => setShortId(event.shortId ?? event.publicId), [event.shortId, event.publicId])
  const host = globalThis.location?.host || 'Votiy.com'
  async function submit(submitEvent) {
    submitEvent.preventDefault(); setState({ saving: true, error: null, saved: false })
    try {
      const result = await saver({ eventId: event.id, shortId: shortId.trim().toLowerCase(),
        expectedUpdatedAt: event.updatedAt })
      setState({ saving: false, error: null, saved: true }); await onSaved(result.event)
    } catch (error) { setState({ saving: false, error, saved: false }) }
  }
  const message = state.error?.code === 'SHORT_LINK_TAKEN' ? 'This short URL is already taken.'
    : state.error?.code === 'SHORT_LINK_RESERVED' ? 'This short URL is protected and cannot be used.'
      : state.error?.fieldErrors?.find(({ field }) => field === 'shortId')?.message ?? state.error?.message
  return <section className="section-card event-short-link-settings" aria-labelledby="event-short-link-title">
    <h2 id="event-short-link-title">Event short URL</h2>
    <form className="app-form" onSubmit={submit}>
      <label className="short-link-field" htmlFor="event-short-id"><span>Event Short Url: {host}/</span>
        <input id="event-short-id" value={shortId} maxLength="50" autoCapitalize="none" autoCorrect="off"
          spellCheck={false} disabled={event.lifecycleStatus === 'ARCHIVED' || state.saving}
          onChange={(inputEvent) => setShortId(inputEvent.target.value.toLowerCase())} /></label>
      {message && <p role="alert">{message}</p>}
      {state.saved && <p role="status">Short URL saved.</p>}
      {event.lifecycleStatus !== 'ARCHIVED' && <button className="primary-action" disabled={state.saving}>
        {state.saving ? 'Saving…' : 'Save short URL'}</button>}
    </form>
  </section>
}
