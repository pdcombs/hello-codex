import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { registerForEvent, loadEventByPublicId } from './events.graphql.js'

export default function EventPage({ viewer = null, loader = loadEventByPublicId, register = registerForEvent }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null, registrationState: 'idle' })

  useEffect(() => {
    let active = true
    setState({ status: 'loading', error: null, event: null, registrationState: 'idle' })
    loader(publicId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', error: null, event: result.event, registrationState: 'idle' })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', error, event: null, registrationState: 'idle' })
      })
    return () => {
      active = false
    }
  }, [publicId, loader])

  async function onRegister() {
    if (!state.event) return
    setState((current) => ({ ...current, registrationState: 'loading', error: null }))
    try {
      await register({
        eventId: state.event.id,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-self-register`,
      })
      setState((current) => ({ ...current, registrationState: 'success' }))
    } catch (error) {
      setState((current) => ({ ...current, registrationState: 'error', error }))
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

  return (
    <main id="main-content" className="page-shell" tabIndex="-1">
      <p className="eyebrow">Voting event</p>
      <h1 data-page-title="true">{state.event.title}</h1>
      {state.event.description && <p>{state.event.description}</p>}
      {state.event.location && <p>{`Location: ${state.event.location}`}</p>}
      <p>{`Registration policy: ${labelForPolicy(state.event.registrationPolicy)}`}</p>

      {state.event.registrationPolicy === 'OPEN' && !state.event.isOwner && (
        <SectionCard title="Join this event">
          {!viewer && <p>Sign in with a verified account to register yourself for this event.</p>}
          {viewer && state.registrationState !== 'success' && (
            <button type="button" onClick={onRegister} disabled={state.registrationState === 'loading'}>
              {state.registrationState === 'loading' ? 'Registering…' : 'Register for event'}
            </button>
          )}
          {state.registrationState === 'success' && <p>You are registered for this event.</p>}
          {state.registrationState === 'error' && <p role="alert">{state.error.message}</p>}
        </SectionCard>
      )}

      {state.event.registrationPolicy === 'ADMIN_MANAGED' && !state.event.isOwner && (
        <SectionCard title="Registration managed by the host">
          <p>The host controls participant registration for this event.</p>
        </SectionCard>
      )}
    </main>
  )
}

function labelForPolicy(policy) {
  return policy === 'OPEN' ? 'Open' : 'Admin managed'
}
