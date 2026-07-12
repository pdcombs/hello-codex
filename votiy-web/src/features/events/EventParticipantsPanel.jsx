import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { addEventParticipant, loadEventRegistrations, removeEventParticipant } from './events.graphql.js'
import ParticipantEntryFields from './ParticipantEntryFields.jsx'
import { readEntries } from './participant-entry-form.js'

export default function EventParticipantsPanel({
  eventId,
  loader = loadEventRegistrations,
  addParticipant = addEventParticipant,
  removeParticipant = removeEventParticipant,
  categories = [],
  legacy = false,
}) {
  const eventSetupAvailable = !legacy
  const [entryCount, setEntryCount] = useState(1)
  const [state, setState] = useState({
    status: 'loading',
    saving: false,
    error: null,
    fieldErrors: {},
    registrations: [],
  })

  useEffect(() => {
    let active = true
    loader(eventId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', saving: false, error: null, fieldErrors: {}, registrations: result.registrations })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', saving: false, error, fieldErrors: {}, registrations: [] })
      })
    return () => {
      active = false
    }
  }, [eventId, loader])

  async function onAdd(event) {
    event.preventDefault()
    if (state.saving) return
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const displayName = clean(form.get('displayName'))
    const email = clean(form.get('email'))
    const phoneInput = clean(form.get('phone'))
    const phone = normalizePhone(phoneInput)
    const entries = eventSetupAvailable ? readEntries(form, entryCount) : []
    const fieldErrors = { ...validateIdentifier(email, phoneInput, phone), ...(eventSetupAvailable ? validateEntries(displayName, entries) : {}) }
    if (Object.keys(fieldErrors).length > 0) {
      setState((current) => ({ ...current, saving: false, error: null, fieldErrors }))
      return
    }
    setState((current) => ({ ...current, saving: true, error: null, fieldErrors: {} }))
    try {
      const result = await addParticipant({
        eventId,
        ...(eventSetupAvailable ? { displayName } : {}),
        email,
        phone,
        ...(eventSetupAvailable ? { entries } : {}),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-participant`,
      })
      setState((current) => ({
        ...current,
        saving: false,
        fieldErrors: {},
        registrations: upsertRegistration(current.registrations, result.registration),
      }))
      formElement.reset()
      setEntryCount(1)
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message]))
      setState((current) => ({ ...current, saving: false, error, fieldErrors }))
    }
  }

  async function onRemove(registrationId) {
    setState((current) => ({ ...current, saving: true, error: null, fieldErrors: {} }))
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
      <p>Add by email, with an optional phone number. Unfinished accounts stay provisional until that person completes sign up.</p>

      <FormSurface onSubmit={onAdd} noValidate>
        {eventSetupAvailable && (
          <FormField label="Display name" htmlFor="participant-display-name" error={state.fieldErrors.displayName}>
            <input id="participant-display-name" name="displayName" type="text" required />
          </FormField>
        )}
        <FormField label="Email" htmlFor="participant-email" error={state.fieldErrors.email}>
          <input id="participant-email" name="email" type="email" placeholder="participant@example.com" />
        </FormField>
        {eventSetupAvailable && <ParticipantEntryFields categories={categories} count={entryCount} errors={state.fieldErrors} onAdd={() => setEntryCount((count) => count + 1)} />}
        <FormField label="Phone" htmlFor="participant-phone" optional error={state.fieldErrors.phone}>
          <input id="participant-phone" name="phone" type="tel" placeholder="(555) 123-4567" />
        </FormField>
        <button type="submit" disabled={state.saving}>
          {state.saving ? 'Saving…' : 'Add participant'}
        </button>
      </FormSurface>

      {state.status === 'loading' && <LoadingState message="Loading participants…" />}
      {Object.keys(state.fieldErrors).length > 0 && (
        <p className="form-error" role="alert">{fieldErrorSummary(state.fieldErrors)}</p>
      )}
      {state.error && Object.keys(state.fieldErrors).length === 0 && (
        <ErrorState title="Participants unavailable" message={state.error.message} />
      )}

      {state.status === 'success' && state.registrations.length === 0 && (
        <EmptyState title="No participants yet" message="No participants registered yet." />
      )}

      {state.status === 'success' && state.registrations.length > 0 && (
        <ul aria-label="Participants" className="record-list">
          {state.registrations.map((registration) => (
            <li key={registration.id}>
              <div>
                <strong>{registration.displayName ?? registration.email ?? registration.phone ?? registration.accountId}</strong>
                <p><span>{registration.entryCount ?? 0} entries</span> · <span>{registration.accountCompleted ? 'Account complete' : 'Provisional account'}</span></p>
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

function validateIdentifier(email, phoneInput, normalizedPhone) {
  if (!email) {
    return { email: 'Enter an email address.' }
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { email: 'Enter a valid email address.' }
  }
  if (phoneInput && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone ?? '')) {
    return { phone: 'Enter a valid phone number, such as (555) 123-4567 or +15551234567.' }
  }
  return {}
}

function validateEntries(displayName, entries) {
  const errors = {}
  if (!displayName) errors.displayName = 'Enter a display name.'
  entries.forEach((entry, index) => {
    if (!entry.title) errors[`entries.${index}.title`] = 'Enter an entry title.'
    if (!entry.categoryId) errors[`entries.${index}.categoryId`] = 'Choose a category.'
  })
  return errors
}

function normalizePhone(value) {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (value.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return value
}

function fieldErrorSummary(fieldErrors) {
  const labels = { email: 'Email', phone: 'Phone', displayName: 'Display name' }
  return Object.entries(fieldErrors)
    .map(([field, message]) => `${labels[field] ?? field}: ${message}`)
    .join(' ')
}

function upsertRegistration(registrations, registration) {
  const existing = registrations.findIndex((item) => item.id === registration.id)
  if (existing === -1) return [...registrations, registration]
  return registrations.map((item) => (item.id === registration.id ? registration : item))
}
