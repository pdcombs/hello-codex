import { useEffect, useRef, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import { createSingleEventEntry } from './events.graphql.js'
import AddEntryOwnerStep from './AddEntryOwnerStep.jsx'

export default function AddEntryModal({ eventId, category, onClose, onSaved,
  creator = createSingleEventEntry, choicesLoader }) {
  const [step, setStep] = useState(1)
  const [owner, setOwner] = useState(null)
  const [createAccountRequest, setCreateAccountRequest] = useState(0)
  const [state, setState] = useState({ saving: false, error: null, titleError: null })
  const headingRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => { headingRef.current?.focus() }, [step])

  function close() {
    if (!state.saving) onClose()
  }

  async function save(event) {
    event.preventDefault()
    const title = new FormData(event.currentTarget).get('title')?.trim()
    if (!title) {
      setState({ saving: false, error: null, titleError: 'Enter an entry title.' })
      return
    }
    setState({ saving: true, error: null, titleError: null })
    try {
      await creator({
        eventId,
        categoryId: category.id,
        title,
        ...(owner.account ? { accountId: owner.account.accountId } : { provisionalOwner: owner.provisionalOwner }),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-entry`,
      })
      await onSaved()
      onClose()
    } catch (error) {
      const titleError = error.fieldErrors?.find((item) => item.field === 'title')?.message ?? null
      setState({ saving: false, error, titleError })
    }
  }

  const ownerName = owner?.account?.displayName ?? owner?.provisionalOwner?.displayName
  return (
    <dialog ref={dialogRef} className="add-entry-dialog" open aria-modal="true" aria-labelledby="add-entry-heading"
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
      onCancel={(event) => { event.preventDefault(); close() }} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); close() }
        if (event.key === 'Tab') trapFocus(event, dialogRef.current)
      }}>
      <div className="add-entry-dialog-card">
        <div className="modal-heading-row">
          <div>
            <p className="eyebrow">Step {step} of 2</p>
            <h2 id="add-entry-heading" ref={headingRef} tabIndex="-1">
              {step === 1 ? 'Who is this entry for?' : 'Name this entry'}
            </h2>
          </div>
          <div className="modal-heading-actions">
            {step === 1 && <button className="primary-action" type="button"
              onClick={() => setCreateAccountRequest((value) => value + 1)}>Create new account</button>}
            <button className="modal-close" type="button" aria-label="Close add entry" onClick={close}>×</button>
          </div>
        </div>
        {step === 1 ? (
          <AddEntryOwnerStep eventId={eventId} loader={choicesLoader} createRequest={createAccountRequest}
            onSelect={(selection) => {
            setOwner(selection); setStep(2)
          }} />
        ) : (
          <FormSurface className="add-entry-title-form" onSubmit={save} noValidate>
            <p>Entry owner: <strong>{ownerName}</strong></p>
            <FormField label="Entry title" htmlFor="new-entry-title" error={state.titleError}>
              <input id="new-entry-title" name="title" autoFocus maxLength="160" />
            </FormField>
            {state.error && !state.titleError && <p role="alert">{state.error.message}</p>}
            <div className="modal-actions">
              <button className="secondary-action" type="button" disabled={state.saving} onClick={() => setStep(1)}>Back</button>
              <button className="secondary-action" type="button" disabled={state.saving} onClick={close}>Cancel</button>
              <button className="primary-action" type="submit" disabled={state.saving}>
                {state.saving ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </FormSurface>
        )}
      </div>
    </dialog>
  )
}

function trapFocus(event, dialog) {
  const controls = [...(dialog?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  ) ?? [])].filter((element) => !element.hidden)
  if (controls.length === 0) return
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
