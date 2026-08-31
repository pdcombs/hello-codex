import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventPage from './EventPage.jsx'
import EventCategoryList from './EventCategoryList.jsx'
import { archiveEventEntry, loadEventDetailView } from './events.graphql.js'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'

export default function OwnerEventPage({
  viewer,
  loader = loadEventDetailView,
  updateCategory,
  archiveEntry = archiveEventEntry,
  workspace = false,
}) {
  const { publicId } = useParams()
  const outlet = useOutletContext()
  const workspaceEvent = workspace ? outlet?.event : null
  const [state, setState] = useState({ status: 'loading', error: null, event: null })

  async function reloadEvent() {
    const result = await loader(publicId)
    setState({ status: 'success', error: null, event: result.event })
  }

  async function onRemoveEntry(entry) {
    try {
      const event = workspaceEvent ?? state.event
      await archiveEntry({ eventId: event.id, entryId: entry.id,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-entry-remove` })
      await (workspace ? outlet.reloadEvent() : reloadEvent())
    } catch (error) {
      setState((current) => ({ ...current, error }))
    }
  }

  useEffect(() => {
    if (workspace) return undefined
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
  }, [publicId, loader, workspace])

  if (workspace) {
    return <>
      <EventCategoryList categories={workspaceEvent.categories} eventId={workspaceEvent.id}
        eventUpdatedAt={workspaceEvent.updatedAt} editable={workspaceEvent.lifecycleStatus !== 'ARCHIVED'}
        updateCategory={updateCategory} onRemoveEntry={onRemoveEntry}
        onEventChange={outlet.setEvent} onRefresh={outlet.reloadEvent} />
    </>
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
      <EventWorkspaceLayout event={state.event} onChanged={reloadEvent}>
        {state.error && <p role="alert">{state.error.message}</p>}
        {Array.isArray(state.event.categories) &&
          <EventCategoryList categories={state.event.categories} eventId={state.event.id}
          eventUpdatedAt={state.event.updatedAt} editable={state.event.lifecycleStatus !== 'ARCHIVED'}
          updateCategory={updateCategory} onRemoveEntry={onRemoveEntry}
          onEventChange={(event) => setState({ status: 'success', error: null, event })}
          onRefresh={reloadEvent} />}
      </EventWorkspaceLayout>
    </main>
  )
}
