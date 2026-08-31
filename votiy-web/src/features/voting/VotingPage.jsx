import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventBallot from './EventBallot.jsx'
import { loadEventBallotView } from './voting.graphql.js'

export default function VotingPage({ loader = loadEventBallotView }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', view: null, error: null })
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', view: null, error: null })
    loader(publicId, { signal: controller.signal }).then((view) => setState({ status: 'success', view, error: null }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ status: 'error', view: null, error }) })
    return () => controller.abort()
  }, [loader, publicId])
  if (state.status === 'loading') return <main id="main-content" className="page-shell voting-page" tabIndex="-1"><LoadingState message="Loading ballot…" /></main>
  if (state.status === 'error') return <main id="main-content" className="page-shell voting-page" tabIndex="-1">
    <ErrorState title="Ballot unavailable" message={state.error.message} />
    <Link className="secondary-action voting-back-link" to={`/events/${publicId}`}>Back to event</Link></main>
  return <main id="main-content" className="page-shell voting-page" tabIndex="-1">
    <p className="eyebrow">Event ballot</p><div className="page-title-row"><div>
      <h1 data-page-title="true" tabIndex="-1">{state.view.event.title}</h1>
      <p>Voting is open. Categories may be left blank, but your ballot needs at least one choice.</p>
    </div><Link className="secondary-action" to={`/events/${publicId}`}>Back to event</Link></div>
    <EventBallot event={state.view.event} submittedBallot={state.view.submittedBallot}
      mayCastAnother={state.view.mayCastAnother} />
  </main>
}
