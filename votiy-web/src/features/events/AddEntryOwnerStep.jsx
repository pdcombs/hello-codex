import { useEffect, useRef, useState } from 'react'
import { loadEntryOwnerChoices } from './events.graphql.js'
import AddEntryProvisionalOwner from './AddEntryProvisionalOwner.jsx'

export default function AddEntryOwnerStep({ eventId, loader = loadEntryOwnerChoices, onSelect, createRequest = null }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState({ status: 'loading', choices: [], error: null })
  const [creating, setCreating] = useState(false)
  const [contactError, setContactError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)
  const sequence = useRef(0)
  const choiceRefs = useRef([])
  const handledCreateRequest = useRef(createRequest)
  const searchableLength = /[a-z@]/i.test(search) ? search.replace(/\s/g, '').length : search.replace(/\D/g, '').length

  useEffect(() => {
    if (search && searchableLength < 3) {
      setState({ status: 'idle', choices: [], error: null })
      return undefined
    }
    const request = ++sequence.current
    setState((current) => ({ ...current, status: 'loading', error: null }))
    const timer = setTimeout(() => {
      loader(eventId, search || null, 10)
        .then((result) => {
          if (request !== sequence.current) return
          setState({ status: 'success', choices: result.choices ?? [], error: null })
        })
        .catch((error) => {
          if (request !== sequence.current) return
          setState({ status: 'error', choices: [], error })
        })
    }, search ? 250 : 0)
    return () => clearTimeout(timer)
  }, [eventId, loader, retryKey, search, searchableLength])

  function beginAccountCreation() {
    if (!isCompleteContact(search)) {
      setContactError('Enter a complete email address or phone number to create a new account.')
      return
    }
    setContactError(null)
    setCreating(true)
  }
  useEffect(() => {
    if (createRequest == null) return
    if (createRequest === handledCreateRequest.current) return
    handledCreateRequest.current = createRequest
    if (!isCompleteContact(search)) {
      setContactError('Enter a complete email address or phone number to create a new account.')
      return
    }
    setContactError(null)
    setCreating(true)
  }, [createRequest, search])
  if (creating) {
    return <AddEntryProvisionalOwner contact={search} onSelect={(provisionalOwner) => onSelect({ provisionalOwner })}
      onCancel={() => setCreating(false)} />
  }
  function navigateChoices(event, index) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const last = state.choices.length - 1
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? last
      : event.key === 'ArrowDown' ? Math.min(index + 1, last) : Math.max(index - 1, 0)
    choiceRefs.current[next]?.focus()
  }
  return (
    <div className="add-entry-owner-step">
      {createRequest == null && <button className="primary-action" type="button"
        onClick={beginAccountCreation}>Create new account</button>}
      <label htmlFor="entry-owner-search">Search by email or phone</label>
      <input id="entry-owner-search" type="search" value={search} autoComplete="off"
        aria-invalid={contactError ? 'true' : undefined} aria-describedby={contactError ? 'entry-owner-contact-error' : undefined}
        onChange={(event) => { setSearch(event.target.value); setCreating(false); setContactError(null) }}
        placeholder="Email or phone" />
      {contactError && <p id="entry-owner-contact-error" role="alert">{contactError}</p>}
      {!search && <p className="choice-help">Recent participants</p>}
      {search && searchableLength < 3 && <p className="choice-help">Enter at least 3 characters.</p>}
      {state.status === 'loading' && <p role="status">Loading participants…</p>}
      {state.status === 'error' && <div className="owner-choice-error">
        <p role="alert">{state.error.message}</p>
        <button className="secondary-action" type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry</button>
      </div>}
      {state.status === 'success' && state.choices.length > 0 && (
        <ul className="entry-owner-choices" role="listbox" aria-label="Entry owners">
          {state.choices.map((choice, index) => (
            <li key={choice.accountId}>
              <button ref={(element) => { choiceRefs.current[index] = element }} type="button" role="option"
                aria-selected="false" onKeyDown={(event) => navigateChoices(event, index)}
                onClick={() => onSelect({ account: choice })}>
                <strong>{choice.displayName}</strong>
                <span>{[choice.email, choice.phone].filter(Boolean).join(' · ') || 'Contact unavailable'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {state.status === 'success' && state.choices.length === 0 && (
        <div className="owner-choice-empty">
          <p>{search ? 'No matching account found.' : 'No recent participants yet.'}</p>
        </div>
      )}
    </div>
  )
}

function isCompleteContact(value) {
  const trimmed = value.trim()
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return true
  const digits = trimmed.replace(/\D/g, '')
  return digits.length === 10 || (trimmed.startsWith('+') && digits.length >= 8 && digits.length <= 15)
}
