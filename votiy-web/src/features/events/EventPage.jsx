import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
      <main className="page-shell">
        <p role="status">Loading event…</p>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="page-shell" role="alert">
        <h1>Event unavailable</h1>
        <p>{state.error.message}</p>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">Voting event</p>
      <h1>{state.event.title}</h1>
      {state.event.description && <p>{state.event.description}</p>}
      {state.event.location && <p>{`Location: ${state.event.location}`}</p>}
      <p>{`Registration policy: ${labelForPolicy(state.event.registrationPolicy)}`}</p>

      {state.event.registrationPolicy === 'OPEN' && !state.event.isOwner && (
        <section aria-labelledby="self-register-heading">
          <h2 id="self-register-heading">Join this event</h2>
          {!viewer && <p>Sign in with a verified account to register yourself for this event.</p>}
          {viewer && state.registrationState !== 'success' && (
            <button type="button" onClick={onRegister} disabled={state.registrationState === 'loading'}>
              {state.registrationState === 'loading' ? 'Registering…' : 'Register for event'}
            </button>
          )}
          {state.registrationState === 'success' && <p>You are registered for this event.</p>}
          {state.registrationState === 'error' && <p role="alert">{state.error.message}</p>}
        </section>
      )}

      {state.event.registrationPolicy === 'ADMIN_MANAGED' && !state.event.isOwner && (
        <section>
          <h2>Registration managed by the host</h2>
          <p>The host controls participant registration for this event.</p>
        </section>
      )}
    </main>
  )
}

function labelForPolicy(policy) {
  return policy === 'OPEN' ? 'Open' : 'Admin managed'
}
