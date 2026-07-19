import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventPage from './EventPage.jsx'
import EventCategoryList from './EventCategoryList.jsx'
import AddEntryModal from './AddEntryModal.jsx'
import { archiveEventEntry, loadEventByPublicId } from './events.graphql.js'

export default function OwnerEventPage({
  viewer,
  loader = loadEventByPublicId,
  addCategory,
  updateCategory,
  archiveEntry = archiveEventEntry,
  entryCreator,
  choicesLoader,
}) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null })
  const [entryModal, setEntryModal] = useState(null)

  async function reloadEvent() {
    const result = await loader(publicId)
    setState({ status: 'success', error: null, event: result.event })
  }

  async function onRemoveEntry(entry) {
    try {
      await archiveEntry({ eventId: state.event.id, entryId: entry.id,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-entry-remove` })
      await reloadEvent()
    } catch (error) {
      setState((current) => ({ ...current, error }))
    }
  }

  function closeEntryModal() {
    const trigger = entryModal?.trigger
    setEntryModal(null)
    requestAnimationFrame(() => trigger?.focus?.())
  }

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
        <Link className="secondary-action event-participants-link"
          to={`/events/${state.event.publicId}/participants`}>View all participants</Link>
      </div>

      {state.error && <p role="alert">{state.error.message}</p>}
      {Array.isArray(state.event.categories) &&
        <EventCategoryList categories={state.event.categories} eventId={state.event.id}
          eventUpdatedAt={state.event.updatedAt} editable
          addCategory={addCategory} updateCategory={updateCategory} onRemoveEntry={onRemoveEntry}
          onEventChange={(event) => setState({ status: 'success', error: null, event })}
          onRefresh={reloadEvent}
          onAddEntry={(category, trigger) => setEntryModal({ category, trigger })} />}
      {entryModal && <AddEntryModal eventId={state.event.id} category={entryModal.category}
        creator={entryCreator} choicesLoader={choicesLoader} onSaved={reloadEvent} onClose={closeEntryModal} />}
    </main>
  )
}
