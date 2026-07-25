import { useEffect, useReducer, useRef, useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import AddEntryOwnerStep from './AddEntryOwnerStep.jsx'
import AddCategoryStep from './AddCategoryStep.jsx'
import AddEntryCategoryStep from './AddEntryCategoryStep.jsx'
import { addEventCategory, createSingleEventEntry, loadEntryOwnerChoices } from './events.graphql.js'
import { addSessionReducer, createAddSession } from './unified-add-session.js'

export default function UnifiedAddSheet({
  event,
  onClose,
  onChanged,
  categoryCreator = addEventCategory,
  entryCreator = createSingleEventEntry,
  choicesLoader = loadEntryOwnerChoices,
  keyFactory,
}) {
  const [state, dispatch] = useReducer(addSessionReducer, event.categories ?? [],
    (categories) => createAddSession(categories, keyFactory))
  const [selectedCategoryId, setSelectedCategoryId] = useState(state.categoryId)
  const dialogRef = useRef(null)
  const headingRef = useRef(null)

  useEffect(() => { headingRef.current?.focus() }, [state.mode, state.entryStep])

  function close() {
    if (!state.saving) onClose()
  }

  async function saveCategory() {
    const title = state.categoryTitle.trim()
    if (!title) {
      dispatch({ type: 'failed', error: null, fieldErrors: { title: 'Enter a category title.' } })
      return
    }
    dispatch({ type: 'saving' })
    try {
      await categoryCreator({ eventId: event.id, title, idempotencyKey: state.idempotencyKey })
      await onChanged?.()
      onClose()
    } catch (error) {
      dispatch({ type: 'failed', error, fieldErrors: toFieldErrors(error) })
    }
  }

  async function saveEntry(eventSubmit) {
    eventSubmit.preventDefault()
    const title = state.entryTitle.trim()
    if (!title) {
      dispatch({ type: 'failed', error: null, fieldErrors: { title: 'Enter an entry title.' } })
      return
    }
    dispatch({ type: 'saving' })
    try {
      await entryCreator({
        eventId: event.id,
        categoryId: state.categoryId,
        title,
        ...(state.owner?.account
          ? { accountId: state.owner.account.accountId }
          : { provisionalOwner: state.owner?.provisionalOwner }),
        idempotencyKey: state.idempotencyKey,
      })
      await onChanged?.()
      onClose()
    } catch (error) {
      const fields = toFieldErrors(error)
      dispatch({
        type: 'failed',
        error,
        fieldErrors: fields,
        entryStep: fields.categoryId ? 'category' : fields.accountId || fields.provisionalOwner ? 'owner' : 'title',
      })
    }
  }

  const title = sheetTitle(state)
  const ownerName = state.owner?.account?.displayName ?? state.owner?.provisionalOwner?.displayName

  return (
    <dialog ref={dialogRef} className="unified-add-dialog" open aria-modal="true"
      aria-labelledby="unified-add-heading"
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
      onCancel={(event) => { event.preventDefault(); close() }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); close() }
        if (event.key === 'Tab') trapFocus(event, dialogRef.current)
      }}>
      <div className="unified-add-sheet">
        <div className="modal-heading-row">
          <h2 id="unified-add-heading" ref={headingRef} tabIndex="-1">{title}</h2>
          <button className="modal-close" type="button" aria-label="Close Add" disabled={state.saving}
            onClick={close}>×</button>
        </div>

        {state.mode === 'choose' && <div className="unified-add-choices">
          <p>What are you adding?</p>
          <button className="primary-action" type="button"
            onClick={() => dispatch({ type: 'choose', mode: 'category' })}>Category</button>
          <button className="primary-action" type="button"
            onClick={() => dispatch({ type: 'choose', mode: 'entry' })}>Entry</button>
        </div>}

        {state.mode === 'category' && <AddCategoryStep value={state.categoryTitle}
          error={state.fieldErrors.title} generalError={state.error} saving={state.saving}
          onChange={(value) => dispatch({ type: 'category-title', value })}
          onBack={() => dispatch({ type: 'back' })} onClose={close} onSubmit={saveCategory} />}

        {state.mode === 'entry' && state.entryStep === 'category' &&
          <AddEntryCategoryStep categories={event.categories ?? []} value={selectedCategoryId}
            error={state.fieldErrors.categoryId}
            onSelect={(categoryId, options = {}) => {
              setSelectedCategoryId(categoryId)
              if (options.advance !== false) dispatch({ type: 'category-selected', categoryId })
            }}
            onBack={() => dispatch({ type: 'back' })} onClose={close} />}

        {state.mode === 'entry' && state.entryStep === 'owner' && <div className="unified-add-owner">
          {state.owner
            ? <div className="unified-add-owner-selection">
                <p>Entry owner: <strong>{ownerName}</strong></p>
                <div className="modal-actions">
                  <button className="secondary-action" type="button"
                    onClick={() => dispatch({ type: 'owner-clear' })}>Choose another account</button>
                  <button className="primary-action" type="button"
                    onClick={() => dispatch({ type: 'owner-selected', owner: state.owner })}>Continue</button>
                </div>
              </div>
            : <AddEntryOwnerStep eventId={event.id} loader={choicesLoader}
                onSelect={(owner) => dispatch({ type: 'owner-selected', owner })} />}
          <div className="modal-actions">
            <button className="secondary-action" type="button" onClick={() => dispatch({ type: 'back' })}>Back</button>
            <button className="secondary-action" type="button" onClick={close}>Cancel</button>
          </div>
        </div>}

        {state.mode === 'entry' && state.entryStep === 'title' &&
          <FormSurface className="unified-add-form" onSubmit={saveEntry} noValidate>
            <p>Entry owner: <strong>{ownerName}</strong></p>
            <FormField label="Entry title" htmlFor="unified-entry-title" error={state.fieldErrors.title}>
              <input id="unified-entry-title" name="title" value={state.entryTitle} autoFocus maxLength="160"
                onChange={(event) => dispatch({ type: 'entry-title', value: event.target.value })} />
            </FormField>
            {state.error && !state.fieldErrors.title && <p role="alert">{state.error.message}</p>}
            <div className="modal-actions">
              <button className="secondary-action" type="button" disabled={state.saving}
                onClick={() => dispatch({ type: 'back' })}>Back</button>
              <button className="secondary-action" type="button" disabled={state.saving} onClick={close}>Cancel</button>
              <button className="primary-action" type="submit" disabled={state.saving}>
                {state.saving ? 'Saving…' : 'Save entry'}
              </button>
            </div>
          </FormSurface>}
      </div>
    </dialog>
  )
}

function sheetTitle(state) {
  if (state.mode === 'choose') return 'Add to event'
  if (state.mode === 'category') return 'Add category'
  if (state.entryStep === 'category') return 'Choose a category'
  if (state.entryStep === 'owner') return 'Who is this entry for?'
  return 'Name this entry'
}

function toFieldErrors(error) {
  return Object.fromEntries((error?.fieldErrors ?? []).map((item) => [item.field, item.message]))
}

function trapFocus(event, dialog) {
  const controls = [...(dialog?.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
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
