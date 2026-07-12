import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventParticipantsPanel from './EventParticipantsPanel.jsx'
import EventPage from './EventPage.jsx'
import EventCategoryManager from './EventCategoryManager.jsx'
import EventCategoryList from './EventCategoryList.jsx'
import EventSetupTabs from './EventSetupTabs.jsx'
import { loadEventByPublicId } from './events.graphql.js'

export default function OwnerEventPage({
  viewer,
  loader = loadEventByPublicId,
  participantsLoader,
  addParticipant,
  removeParticipant,
  addCategory,
  renameCategory,
}) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null })
  const [tab, setTab] = useState('setup')

  useEffect(() => {
    let active = true
    setState({ status: 'loading', error: null, event: null })
    loader(publicId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', error: null, event: result.event })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', error, event: null })
      })
    return () => {
      active = false
    }
  }, [publicId, loader])

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
      <div className="event-title-row">
        <Link className="secondary-action" to="/">Back to events</Link>
        <h1 data-page-title="true">{state.event.title}</h1>
      </div>

      <div className="event-summary">
        {state.event.description && <p className="event-description">{state.event.description}</p>}
        <dl className="event-meta">
          {state.event.location && (
            <div>
              <dt>Location</dt>
              <dd>{state.event.location}</dd>
            </div>
          )}
          <div>
            <dt>Registration</dt>
            <dd>{state.event.registrationPolicy === 'OPEN' ? 'Open' : 'Admin managed'}</dd>
          </div>
          <div>
            <dt>Event link</dt>
            <dd><a href={`/events/${state.event.publicId}`}>{`/events/${state.event.publicId}`}</a></dd>
          </div>
        </dl>
      </div>

      {state.error && <p role="alert">{state.error.message}</p>}
      {Array.isArray(state.event.categories) ? <EventSetupTabs activeTab={tab} onChange={setTab}
        setup={<><EventCategoryManager event={state.event} addCategory={addCategory} renameCategory={renameCategory}
          onEventChange={(event) => setState((current) => ({ ...current, event }))} />
          <EventCategoryList categories={state.event.categories} /></>}
        participants={<EventParticipantsPanel eventId={state.event.id} loader={participantsLoader}
          addParticipant={addParticipant} removeParticipant={removeParticipant} categories={state.event.categories} />} />
        : <EventParticipantsPanel eventId={state.event.id} loader={participantsLoader} addParticipant={addParticipant}
          removeParticipant={removeParticipant} legacy />}
    </main>
  )
}
