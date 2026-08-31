import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventPage from './EventPage.jsx'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'
import { loadEventDetailView } from './events.graphql.js'

export default function OwnerEventWorkspacePage({ viewer, loader = loadEventDetailView }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null })

  async function reloadEvent() {
    try {
      const result = await loader(publicId)
      setState({ status: 'success', error: null, event: result.event })
      return result.event
    } catch (error) {
      setState((current) => ({ ...current, error }))
      throw error
    }
  }

  useEffect(() => {
    let active = true
    setState({ status: 'loading', error: null, event: null })
    loader(publicId)
      .then((result) => active && setState({ status: 'success', error: null, event: result.event }))
      .catch((error) => active && setState({ status: 'error', error, event: null }))
    return () => { active = false }
  }, [loader, publicId])

  if (state.status === 'loading') return <main id="main-content" className="page-shell" tabIndex="-1">
    <LoadingState message="Loading event…" />
  </main>
  if (state.status === 'error') return <main id="main-content" className="page-shell" tabIndex="-1">
    <ErrorState title="Event unavailable" message={state.error.message} />
  </main>
  if (!state.event.isOwner) {
    return <EventPage viewer={viewer} loader={() => Promise.resolve({ event: state.event })} />
  }

  const setEvent = (event) => setState({ status: 'success', error: null, event })
  return <main id="main-content" className="page-shell" tabIndex="-1">
    <EventWorkspaceLayout event={state.event} onChanged={reloadEvent}>
      {state.error && <p role="alert">{state.error.message}</p>}
      <Outlet context={{ event: state.event, reloadEvent, setEvent }} />
    </EventWorkspaceLayout>
  </main>
}
