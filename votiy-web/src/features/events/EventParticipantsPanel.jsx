import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { addEventParticipant, loadEventRegistrations, removeEventParticipant } from './events.graphql.js'

export default function EventParticipantsPanel({
  eventId,
  loader = loadEventRegistrations,
  addParticipant = addEventParticipant,
  removeParticipant = removeEventParticipant,
}) {
  const [state, setState] = useState({
    status: 'loading',
    saving: false,
    error: null,
    registrations: [],
  })

  useEffect(() => {
    let active = true
    loader(eventId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', saving: false, error: null, registrations: result.registrations })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', saving: false, error, registrations: [] })
      })
    return () => {
      active = false
    }
  }, [eventId, loader])

  async function onAdd(event) {
    event.preventDefault()
    if (state.saving) return
    const form = new FormData(event.currentTarget)
    const email = clean(form.get('email'))
    const phone = clean(form.get('phone'))
    setState((current) => ({ ...current, saving: true, error: null }))
    try {
      const result = await addParticipant({
        eventId,
        email,
        phone,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-participant`,
      })
      setState((current) => ({
        ...current,
        saving: false,
        registrations: upsertRegistration(current.registrations, result.registration),
      }))
      event.currentTarget.reset()
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error }))
    }
  }

  async function onRemove(registrationId) {
    setState((current) => ({ ...current, saving: true, error: null }))
    try {
      const result = await removeParticipant({ eventId, registrationId })
      setState((current) => ({
        ...current,
        saving: false,
        registrations: current.registrations.filter((item) => item.id !== result.registration.id),
      }))
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error }))
    }
  }

  return (
    <SectionCard title="Participants">
      <p>Add by email or phone. Unfinished accounts stay provisional until that person completes sign up.</p>

      <form className="app-form participant-form" onSubmit={onAdd}>
        <div className="field-grid">
          <div className="form-row">
            <label htmlFor="participant-email">Email</label>
            <input id="participant-email" name="email" type="email" placeholder="participant@example.com" />
          </div>
          <div className="form-row">
            <label htmlFor="participant-phone">Phone</label>
            <input id="participant-phone" name="phone" type="tel" placeholder="(555) 123-4567" />
          </div>
        </div>
        <button type="submit" disabled={state.saving}>
          {state.saving ? 'Saving…' : 'Add participant'}
        </button>
      </form>

      {state.status === 'loading' && <LoadingState message="Loading participants…" />}
      {state.error && <ErrorState title="Participants unavailable" message={state.error.message} />}

      {state.status === 'success' && state.registrations.length === 0 && (
        <EmptyState title="No participants yet" message="No participants registered yet." />
      )}

      {state.status === 'success' && state.registrations.length > 0 && (
        <ul aria-label="Participants" className="record-list">
          {state.registrations.map((registration) => (
            <li key={registration.id}>
              <div>
                <strong>{registration.email ?? registration.phone ?? registration.accountId}</strong>
                <p>{registration.accountCompleted ? 'Account complete' : 'Provisional account'}</p>
              </div>
              <button type="button" onClick={() => onRemove(registration.id)} disabled={state.saving}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function clean(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized === '' ? null : normalized
}

function upsertRegistration(registrations, registration) {
  const existing = registrations.findIndex((item) => item.id === registration.id)
  if (existing === -1) return [...registrations, registration]
  return registrations.map((item) => (item.id === registration.id ? registration : item))
}
