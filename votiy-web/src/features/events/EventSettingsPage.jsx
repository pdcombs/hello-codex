import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventRulesEditor from '../voting/EventRulesEditor.jsx'
import VotingCodeManager from '../voting/VotingCodeManager.jsx'
import { updateEventVotingRules } from '../voting/voting.graphql.js'
import { archiveEvent, loadEventDetailView, setEventVisibility } from './events.graphql.js'

export default function EventSettingsPage({ loader = loadEventDetailView, visibilitySaver = setEventVisibility,
  archiver = archiveEvent }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', event: null, error: null })
  const reload = useCallback(async () => {
    const { event } = await loader(publicId)
    if (!event.isOwner) throw new Error('Only the event host can manage settings.')
    setState({ status: 'success', event, error: null })
  }, [loader, publicId])
  useEffect(() => {
    reload().catch((error) => setState({ status: 'error', event: null, error }))
  }, [reload])
  if (state.status === 'loading') return <main id="main-content" className="page-shell"><LoadingState message="Loading settings…" /></main>
  if (state.status === 'error') return <main id="main-content" className="page-shell"><ErrorState title="Settings unavailable" message={state.error.message} /></main>
  return <main id="main-content" className="page-shell event-settings-page">
    <Link className="secondary-action" to={`/events/${publicId}`} aria-label="Back to event entries">← Back</Link>
    <h1 data-page-title="true" tabIndex="-1">Event settings</h1>
    <section className="section-card">
      <h2>Event visibility</h2>
      {state.event.lifecycleStatus === 'ARCHIVED' ? <p>This event is archived and read-only.</p> : (
        <form className="app-form" onSubmit={async (event) => {
          event.preventDefault()
          const visibility = new FormData(event.currentTarget).get('visibility')
          try {
            await visibilitySaver({ eventId: state.event.id, visibility,
              expectedUpdatedAt: state.event.updatedAt })
            await reload()
          } catch (error) { setState((current) => ({ ...current, error })) }
        }}>
          <label>Who can discover this event?
            <select name="visibility" defaultValue={state.event.visibility ?? 'PUBLIC'}>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="UNLISTED">Unlisted</option>
            </select>
          </label>
          <button type="submit" className="primary-action">Save visibility</button>
          <button type="button" className="danger-action" onClick={async () => {
            if (!globalThis.confirm('Archive this event permanently? It cannot be restored.')) return
            try {
              await archiver({ eventId: state.event.id, expectedUpdatedAt: state.event.updatedAt,
                confirmation: true })
              await reload()
            } catch (error) { setState((current) => ({ ...current, error })) }
          }}>Archive event</button>
        </form>
      )}
      {state.error && <p role="alert">{state.error.message}</p>}
    </section>
    {state.event.voting?.rules && <EventRulesEditor event={state.event} saver={updateEventVotingRules} onSaved={reload} />}
    {state.event.voting?.rules?.accessPolicy === 'CODE' && <VotingCodeManager eventId={state.event.id} />}
  </main>
}
