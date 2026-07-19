import { useEffect, useRef } from 'react'

export default function RemoveCategoryDialog({ category, entryCount, pending = false, error,
  onCancel, onConfirm, onRefresh }) {
  const cancelRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape' && !pending) onCancel()
      if (event.key !== 'Tab') return
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled)')]
      if (!controls.length) return
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel, pending])

  return <div className="dialog-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !pending) onCancel()
  }}>
    <div className="remove-category-dialog" role="alertdialog" aria-modal="true"
      aria-labelledby="remove-category-title" aria-describedby="remove-category-warning" ref={dialogRef}>
      <h2 id="remove-category-title">Remove {category.title}?</h2>
      <p id="remove-category-warning">This will remove {entryCount} {entryCount === 1 ? 'entry' : 'entries'} in this category. This action cannot be undone.</p>
      {error && <div className="form-error" role="alert"><p>{error.message}</p>
        {error.code === 'CONFLICT' && onRefresh && <button className="secondary-action" type="button"
          onClick={onRefresh}>Refresh current event</button>}</div>}
      <div className="dialog-actions">
        <button className="secondary-action" type="button" ref={cancelRef} disabled={pending} onClick={onCancel}>Cancel</button>
        <button className="destructive-action" type="button" disabled={pending} onClick={onConfirm}>
          {pending ? 'Removing…' : 'Remove category'}
        </button>
      </div>
    </div>
  </div>
}
