import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventParticipantsPanel from './EventParticipantsPanel.jsx'
import { loadEventByPublicId } from './events.graphql.js'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'

export default function OwnerEventParticipantsPage({
  loader = loadEventByPublicId,
  participantsLoader,
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

  async function reloadEvent() {
    const result = await loader(publicId)
    if (!result.event.isOwner) throw new Error('Only the event host can view this participant list.')
    setState({ status: 'success', event: result.event, error: null })
  }

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
      <EventWorkspaceLayout event={state.event} onChanged={reloadEvent}>
        <EventParticipantsPanel eventId={state.event.id} loader={participantsLoader}
          removeParticipant={removeParticipant} />
      </EventWorkspaceLayout>
    </main>
  )
}
