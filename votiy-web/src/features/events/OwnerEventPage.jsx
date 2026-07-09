import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import EventParticipantsPanel from './EventParticipantsPanel.jsx'
import EventPage from './EventPage.jsx'
import { loadEventByPublicId, setEventRegistrationPolicy } from './events.graphql.js'

export default function OwnerEventPage({
  viewer,
  loader = loadEventByPublicId,
  updatePolicy = setEventRegistrationPolicy,
  participantsLoader,
  addParticipant,
  removeParticipant,
}) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null, saving: false })

  useEffect(() => {
    let active = true
    setState({ status: 'loading', error: null, event: null, saving: false })
    loader(publicId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', error: null, event: result.event, saving: false })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', error, event: null, saving: false })
      })
    return () => {
      active = false
    }
  }, [publicId, loader])

  async function changePolicy(registrationPolicy) {
    if (!state.event || state.saving) return
    setState((current) => ({ ...current, saving: true, error: null }))
    try {
      const result = await updatePolicy({ eventId: state.event.id, registrationPolicy })
      setState({ status: 'success', error: null, event: result.event, saving: false })
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error }))
    }
  }

  if (state.status === 'loading') {
    return (
      <main id="main-content" className="page-shell" tabIndex="-1">
        <LoadingState message="Loading event…" />
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main id="main-content" className="page-shell" tabIndex="-1">
        <ErrorState title="Event unavailable" message={state.error.message} />
      </main>
    )
  }

  if (!state.event.isOwner) {
    return <EventPage viewer={viewer} loader={loader} />
  }

  return (
    <main id="main-content" className="page-shell" tabIndex="-1">
      <p className="eyebrow">Hosted event</p>
      <h1 data-page-title="true">{state.event.title}</h1>
      {state.event.description && <p>{state.event.description}</p>}
      {state.event.location && <p>{`Location: ${state.event.location}`}</p>}
      <p>{`Event link: /events/${state.event.publicId}`}</p>

      <SectionCard
        title="Registration policy"
        actions={
          <div className="page-actions">
            <button type="button" onClick={() => changePolicy('ADMIN_MANAGED')} disabled={state.saving}>
              Make admin managed
            </button>
            <button type="button" onClick={() => changePolicy('OPEN')} disabled={state.saving}>
              Make open
            </button>
          </div>
        }
      >
        <p>{`Current policy: ${state.event.registrationPolicy === 'OPEN' ? 'Open' : 'Admin managed'}`}</p>
      </SectionCard>

      {state.error && <p role="alert">{state.error.message}</p>}

      <EventParticipantsPanel
        eventId={state.event.id}
        loader={participantsLoader}
        addParticipant={addParticipant}
        removeParticipant={removeParticipant}
      />
    </main>
  )
}
