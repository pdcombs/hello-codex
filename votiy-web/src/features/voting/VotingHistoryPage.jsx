import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SubmittedBallotReview from './SubmittedBallotReview.jsx'
import VotingCodeModal from './VotingCodeModal.jsx'
import { loadEventBallotHistory, requestVotingAccess } from './voting.graphql.js'

export default function VotingHistoryPage({ loader = loadEventBallotHistory, requester = requestVotingAccess }) {
  const { publicId } = useParams(); const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', event: null, nodes: [], nextCursor: null,
    hasMore: false, mayCastAnother: false, error: null })
  const [repeat, setRepeat] = useState({ open: false, pending: false, error: null })
  const repeatTriggerRef = useRef(null)

  const load = useCallback(async (after = null, signal = undefined, initial = false) => {
    setState((current) => ({ ...current, status: initial ? 'loading' : 'loading-more', error: null }))
    try {
      const result = await loader(publicId, { first: 20, after, signal })
      setState((current) => ({ status: 'success', event: result.event,
        nodes: initial ? result.nodes : deduplicate([...current.nodes, ...result.nodes]),
        nextCursor: result.nextCursor, hasMore: result.hasMore, mayCastAnother: result.mayCastAnother, error: null }))
    } catch (error) {
      if (error.name === 'AbortError') return
      setState((current) => ({ ...current, status: initial ? 'error' : 'more-error', error }))
    }
  }, [loader, publicId])

  useEffect(() => {
    const controller = new AbortController()
    load(null, controller.signal, true)
    return () => controller.abort()
  }, [load])

  async function authorizeAnother(accessCode) {
    setRepeat((current) => ({ ...current, pending: true, error: null }))
    try {
      const access = await requester({ eventId: state.event.id, accessCode })
      if (!access.allowed) {
        setRepeat((current) => ({ ...current, pending: false,
          error: new Error(access.decision === 'CODE_REQUIRED' ? 'That voting code is invalid or already used.'
            : 'Another vote cannot be started at this time.') }))
        return
      }
      navigate(`/events/${publicId}/vote`, { state: { startFresh: true } })
    } catch (error) { setRepeat((current) => ({ ...current, pending: false, error })) }
  }

  if (state.status === 'loading') return <main id="main-content" className="page-shell voting-history-page" tabIndex="-1">
    <LoadingState message="Loading previous votes…" /></main>
  if (state.status === 'error') return <main id="main-content" className="page-shell voting-history-page" tabIndex="-1">
    <ErrorState title="Previous votes unavailable" message={state.error.message} />
    <button className="secondary-action" type="button" onClick={() => load(null, undefined, true)}>Retry</button>
    <Link className="secondary-action voting-back-link" to={`/events/${publicId}`}>Back to event</Link></main>

  const closed = state.event.votingState?.status !== 'OPEN'
  return <main id="main-content" className="page-shell voting-history-page" tabIndex="-1">
    <p className="eyebrow">Private voting history</p>
    <div className="page-title-row"><div><h1 data-page-title="true" tabIndex="-1">Previous votes for {state.event.title}</h1>
      <p>{closed ? 'Voting is closed. Previous votes remain available to review.' : 'Your saved votes appear newest first.'}</p>
    </div><Link className="secondary-action" to={`/events/${publicId}`}>Back to event</Link></div>

    {!state.nodes.length && <div className="status-card"><h2>No previous votes</h2><p>No saved votes were found for this account or browser.</p></div>}
    <div className="voting-history-list">{state.nodes.map((ballot, index) =>
      <SubmittedBallotReview key={ballot.id} ballot={ballot} index={index} />)}</div>

    <div className="voting-history-actions">
      {state.hasMore && state.status !== 'loading-more' && <button className="secondary-action" type="button"
        onClick={() => load(state.nextCursor)}>Load more votes</button>}
      {state.status === 'loading-more' && <p role="status">Loading more votes…</p>}
      {state.status === 'more-error' && <div className="form-alert" role="alert"><p>{state.error.message}</p>
        <button className="secondary-action" type="button" onClick={() => load(state.nextCursor)}>Retry loading votes</button></div>}
      {!closed && state.mayCastAnother && <button className="primary-action" type="button" ref={repeatTriggerRef}
        onClick={() => setRepeat({ open: true, pending: false, error: null })}>Cast another vote</button>}
    </div>

    {repeat.open && <VotingCodeModal pending={repeat.pending} error={repeat.error} triggerRef={repeatTriggerRef}
      title="Enter a new voting code" description="Every ballot needs a different unused voting code."
      onCancel={() => setRepeat({ open: false, pending: false, error: null })} onSubmit={authorizeAnother} />}
  </main>
}

function deduplicate(nodes) { return [...new Map(nodes.map((node) => [node.id, node])).values()] }
