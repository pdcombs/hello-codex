import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import EventBallot from './EventBallot.jsx'
import VotingCodeModal from './VotingCodeModal.jsx'
import { loadEventBallotView, requestVotingAccess } from './voting.graphql.js'

export default function VotingPage({ loader = loadEventBallotView, requester = requestVotingAccess }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', view: null, error: null })
  const [repeat, setRepeat] = useState({ modal: false, pending: false, error: null, authorized: false, attempt: 0 })
  const repeatTriggerRef = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading', view: null, error: null })
    setRepeat({ modal: false, pending: false, error: null, authorized: false, attempt: 0 })
    loader(publicId, { signal: controller.signal }).then((view) => setState({ status: 'success', view, error: null }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ status: 'error', view: null, error }) })
    return () => controller.abort()
  }, [loader, publicId])

  async function authorizeAnother(accessCode) {
    setRepeat((current) => ({ ...current, pending: true, error: null }))
    try {
      const access = await requester({ eventId: state.view.event.id, accessCode })
      if (!access.allowed) {
        const message = access.decision === 'CODE_REQUIRED'
          ? 'That voting code is invalid or already used.' : 'Another vote cannot be started at this time.'
        setRepeat((current) => ({ ...current, pending: false, error: new Error(message) }))
        return
      }
      setRepeat((current) => ({ modal: false, pending: false, error: null, authorized: true,
        attempt: current.attempt + 1 }))
    } catch (error) { setRepeat((current) => ({ ...current, pending: false, error })) }
  }
  if (state.status === 'loading') return <main id="main-content" className="page-shell voting-page" tabIndex="-1"><LoadingState message="Loading ballot…" /></main>
  if (state.status === 'error') return <main id="main-content" className="page-shell voting-page" tabIndex="-1">
    <ErrorState title="Ballot unavailable" message={state.error.message} />
    <Link className="secondary-action voting-back-link" to={`/events/${publicId}`}>Back to event</Link></main>
  return <main id="main-content" className="page-shell voting-page" tabIndex="-1">
    <p className="eyebrow">Event ballot</p><div className="page-title-row"><div>
      <h1 data-page-title="true" tabIndex="-1">{state.view.event.title}</h1>
      <p>Voting is open. Categories may be left blank, but your ballot needs at least one choice.</p>
    </div><Link className="secondary-action" to={`/events/${publicId}`}>Back to event</Link></div>
    <EventBallot key={repeat.attempt} event={state.view.event}
      submittedBallot={repeat.authorized ? null : state.view.submittedBallot}
      mayCastAnother={!repeat.authorized && state.view.mayCastAnother}
      onCastAnother={(trigger) => { repeatTriggerRef.current = trigger
        setRepeat((current) => ({ ...current, modal: true, error: null })) }} />
    {repeat.modal && <VotingCodeModal pending={repeat.pending} error={repeat.error}
      title="Enter a new voting code" description="Every ballot needs a different unused voting code."
      triggerRef={repeatTriggerRef}
      onCancel={() => setRepeat((current) => ({ ...current, modal: false, pending: false, error: null }))}
      onSubmit={authorizeAnother} />}
  </main>
}
