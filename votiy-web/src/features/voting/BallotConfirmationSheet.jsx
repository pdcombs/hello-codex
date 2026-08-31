import { useEffect, useRef } from 'react'

export default function BallotConfirmationSheet({ pending = false, triggerRef, onCancel, onConfirm }) {
  const sheetRef = useRef(null)
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape' && !pending) { onCancel(); triggerRef?.current?.focus(); return }
      if (event.key !== 'Tab') return
      const controls = [...sheetRef.current.querySelectorAll('button:not(:disabled)')]
      if (!controls.length) return
      const first = controls[0]; const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, pending, triggerRef])
  function cancel() { onCancel(); requestAnimationFrame(() => triggerRef?.current?.focus()) }
  return <div className="dialog-backdrop ballot-confirm-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !pending) cancel()
  }}><section className="ballot-confirm-sheet" role="alertdialog" aria-modal="true"
    aria-labelledby="ballot-confirm-title" aria-describedby="ballot-confirm-warning" ref={sheetRef}>
    <div className="ballot-sheet-handle" aria-hidden="true" />
    <h2 id="ballot-confirm-title">Submit your vote?</h2>
    <p id="ballot-confirm-warning">Are you sure? You will not be able to redo your vote after submitting.</p>
    <div className="dialog-actions">
      <button ref={cancelRef} className="secondary-action" type="button" disabled={pending} onClick={cancel}>Cancel</button>
      <button className="primary-action" type="button" disabled={pending} onClick={onConfirm}>
        {pending ? 'Submitting…' : 'Yes, submit vote'}</button>
    </div>
  </section></div>
}
