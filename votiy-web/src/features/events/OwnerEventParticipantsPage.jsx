import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventParticipantsPanel from './EventParticipantsPanel.jsx'
import { loadEventByPublicId } from './events.graphql.js'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'

export default function OwnerEventParticipantsPage({
  loader = loadEventByPublicId,
  participantsLoader,
  removeParticipant,
  workspace = false,
}) {
  const { publicId } = useParams()
  const outlet = useOutletContext()
  const [state, setState] = useState({ status: 'loading', event: null, error: null })

  useEffect(() => {
    if (workspace) return undefined
    let active = true
    loader(publicId)
      .then((result) => {
        if (!active) return
        if (!result.event.isOwner) throw new Error('Only the event host can view this participant list.')
        setState({ status: 'success', event: result.event, error: null })
      })
      .catch((error) => active && setState({ status: 'error', event: null, error }))
    return () => { active = false }
  }, [loader, publicId, workspace])

  async function reloadEvent() {
    if (workspace) return outlet.reloadEvent()
    const result = await loader(publicId)
    if (!result.event.isOwner) throw new Error('Only the event host can view this participant list.')
    setState({ status: 'success', event: result.event, error: null })
  }

  if (workspace) return <EventParticipantsPanel eventId={outlet.event.id} loader={participantsLoader}
    removeParticipant={removeParticipant} />

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
