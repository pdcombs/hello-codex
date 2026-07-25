import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventRulesEditor from '../voting/EventRulesEditor.jsx'
import VotingCodeManager from '../voting/VotingCodeManager.jsx'
import { updateEventVotingRules } from '../voting/voting.graphql.js'
import { loadEventByPublicId } from './events.graphql.js'

export default function EventSettingsPage({ loader = loadEventByPublicId }) {
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
    {state.event.voting?.rules && <EventRulesEditor event={state.event} saver={updateEventVotingRules} onSaved={reload} />}
    {state.event.voting?.rules?.accessPolicy === 'CODE' && <VotingCodeManager eventId={state.event.id} />}
  </main>
}
