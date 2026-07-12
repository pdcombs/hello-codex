import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventParticipantsPanel from './EventParticipantsPanel.jsx'
import { loadEventByPublicId } from './events.graphql.js'

export default function OwnerEventParticipantsPage({
  loader = loadEventByPublicId,
  participantsLoader,
  addParticipant,
  removeParticipant,
}) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', event: null, error: null })

  useEffect(() => {
    let active = true
    loader(publicId)
      .then((result) => {
        if (!active) return
        if (!result.event.isOwner) throw new Error('Only the event host can view this participant list.')
        setState({ status: 'success', event: result.event, error: null })
      })
      .catch((error) => active && setState({ status: 'error', event: null, error }))
    return () => { active = false }
  }, [loader, publicId])

  if (state.status === 'loading') {
    return <main id="main-content" className="page-shell" tabIndex="-1"><LoadingState message="Loading participants…" /></main>
  }
  if (state.status === 'error') {
    return <main id="main-content" className="page-shell" tabIndex="-1">
      <ErrorState title="Participants unavailable" message={state.error.message} />
    </main>
  }

  return (
    <main id="main-content" className="page-shell" tabIndex="-1">
      <Link className="secondary-action" to={`/events/${state.event.publicId}`}>Back to event</Link>
      <h1 className="participant-page-title" data-page-title="true">{state.event.title} participants</h1>
      <EventParticipantsPanel eventId={state.event.id} loader={participantsLoader}
        addParticipant={addParticipant} removeParticipant={removeParticipant}
        categories={state.event.categories ?? []} />
    </main>
  )
}
