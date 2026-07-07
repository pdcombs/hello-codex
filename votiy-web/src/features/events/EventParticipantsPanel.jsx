import { useEffect, useState } from 'react'
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
    <section aria-labelledby="participants-heading">
      <h2 id="participants-heading">Participants</h2>
      <p>Add by email or phone. Unfinished accounts stay provisional until that person completes sign up.</p>

      <form onSubmit={onAdd}>
        <label htmlFor="participant-email">Email</label>
        <input id="participant-email" name="email" type="email" />
        <label htmlFor="participant-phone">Phone</label>
        <input id="participant-phone" name="phone" type="tel" />
        <button type="submit" disabled={state.saving}>
          {state.saving ? 'Saving…' : 'Add participant'}
        </button>
      </form>

      {state.status === 'loading' && <p role="status">Loading participants…</p>}
      {state.error && <p role="alert">{state.error.message}</p>}

      {state.status === 'success' && state.registrations.length === 0 && <p>No participants registered yet.</p>}

      {state.status === 'success' && state.registrations.length > 0 && (
        <ul aria-label="Participants">
          {state.registrations.map((registration) => (
            <li key={registration.id}>
              <span>{registration.email ?? registration.phone ?? registration.accountId}</span>
              <span>{registration.accountCompleted ? ' — account complete' : ' — provisional account'}</span>
              <button type="button" onClick={() => onRemove(registration.id)} disabled={state.saving}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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
