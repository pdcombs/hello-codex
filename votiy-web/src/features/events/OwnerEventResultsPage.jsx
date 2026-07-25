import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventWorkspaceLayout from './EventWorkspaceLayout.jsx'
import { loadEventByPublicId } from './events.graphql.js'

export default function OwnerEventResultsPage({ loader = loadEventByPublicId }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', event: null, error: null })
  useEffect(() => {
    loader(publicId).then(({ event }) => setState({ status: 'success', event, error: null }))
      .catch((error) => setState({ status: 'error', event: null, error }))
  }, [loader, publicId])
  async function reloadEvent() {
    const result = await loader(publicId)
    setState({ status: 'success', event: result.event, error: null })
  }
  if (state.status === 'loading') return <main id="main-content" className="page-shell"><LoadingState message="Loading event…" /></main>
  if (state.status === 'error') return <main id="main-content" className="page-shell"><ErrorState title="Event unavailable" message={state.error.message} /></main>
  return <main id="main-content" className="page-shell">
    <EventWorkspaceLayout event={state.event} onChanged={reloadEvent}>
      <section className="coming-soon" aria-labelledby="results-title">
        <h2 id="results-title">🎉 Feature Coming Soon</h2>
      </section>
    </EventWorkspaceLayout>
  </main>
}
