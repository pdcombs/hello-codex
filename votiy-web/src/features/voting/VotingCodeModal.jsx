import { useEffect, useRef } from 'react'
import { FormField, FormSurface, TextInput } from '../../components/Form.jsx'

export default function VotingCodeModal({ pending = false, error = null, title = 'Enter voting code',
  description = 'This event requires an unused generated code.', triggerRef = null,
  canViewPrevious = false, onViewPrevious = null, onCancel, onSubmit }) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape' && !pending) { cancel(); return }
      if (event.key !== 'Tab') return
      const controls = [...dialogRef.current.querySelectorAll('input:not(:disabled), button:not(:disabled)')]
      if (!controls.length) return
      const first = controls[0]; const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  function cancel() {
    onCancel()
    queueMicrotask(() => triggerRef?.current?.focus())
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !pending) cancel()
  }}><section className="voting-code-dialog" role="dialog" aria-modal="true"
    aria-labelledby="voting-code-title" aria-describedby="voting-code-description" ref={dialogRef}>
    <h2 id="voting-code-title">{title}</h2>
    <p id="voting-code-description">{description}</p>
    <FormSurface onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget).get('code')) }}>
      <FormField label="Voting code" htmlFor="voting-access-code" error={error?.message} fullWidth>
        <TextInput ref={inputRef} id="voting-access-code" name="code" autoComplete="one-time-code" required />
      </FormField>
      <div className="dialog-actions">
        {canViewPrevious && <button className="secondary-action voting-history-action" type="button"
          disabled={pending} onClick={onViewPrevious}>View previous votes</button>}
        <button className="secondary-action" type="button" disabled={pending} onClick={cancel}>Cancel</button>
        <button className="primary-action" disabled={pending}>{pending ? 'Checking…' : 'Continue'}</button>
      </div>
    </FormSurface>
  </section></div>
}
