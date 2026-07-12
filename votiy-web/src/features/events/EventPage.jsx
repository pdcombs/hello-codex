import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { registerForEvent, loadEventByPublicId } from './events.graphql.js'
import { FormSurface } from '../../components/Form.jsx'
import ParticipantEntryFields from './ParticipantEntryFields.jsx'
import { readEntries } from './participant-entry-form.js'

export default function EventPage({ viewer = null, loader = loadEventByPublicId, register = registerForEvent }) {
  const { publicId } = useParams()
  const [state, setState] = useState({ status: 'loading', error: null, event: null, registrationState: 'idle' })
  const [entryCount, setEntryCount] = useState(1)
  const [fieldErrors, setFieldErrors] = useState({})

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

  async function onRegister(submitEvent) {
    submitEvent.preventDefault()
    if (!state.event) return
    const entries = readEntries(new FormData(submitEvent.currentTarget), entryCount)
    const errors = Object.fromEntries(entries.flatMap((entry, index) => [
      ...(!entry.title ? [[`entries.${index}.title`, 'Enter an entry title.']] : []),
      ...(!entry.categoryId ? [[`entries.${index}.categoryId`, 'Choose a category.']] : []),
    ]))
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setState((current) => ({ ...current, registrationState: 'loading', error: null }))
    try {
      await register({
        eventId: state.event.id,
        entries,
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
      <div className="event-title-row">
        <Link className="secondary-action" to="/">Back to home</Link>
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
            <dd>{labelForPolicy(state.event.registrationPolicy)}</dd>
          </div>
          <div>
            <dt>Event link</dt>
            <dd><a href={`/events/${state.event.publicId}`}>{`/events/${state.event.publicId}`}</a></dd>
          </div>
        </dl>
      </div>

      {state.event.registrationPolicy === 'OPEN' && !state.event.isOwner && (
        <SectionCard title="Join this event">
          {!viewer && <p>Sign in with a verified account to register yourself for this event.</p>}
          {viewer && state.registrationState !== 'success' && (
            <FormSurface onSubmit={onRegister} noValidate>
              <ParticipantEntryFields categories={state.event.categories} count={entryCount} errors={fieldErrors} onAdd={() => setEntryCount((count) => count + 1)} />
              <button className="primary-action" type="submit" disabled={state.registrationState === 'loading'}>
                {state.registrationState === 'loading' ? 'Registering…' : 'Register for event'}
              </button>
            </FormSurface>
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
