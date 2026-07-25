import { useEffect, useRef } from 'react'

export default function EventPhotoDialog({ event, owner, onClose, onReplace, onDelete }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="event-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="event-photo-title">
        <div className="dialog-title-row">
          <h2 id="event-photo-title">{event.title} photo</h2>
          <button ref={closeRef} className="secondary-action" type="button" onClick={onClose}>Close</button>
        </div>
        <img src={event.photo.url} alt={`${event.title} event`} />
        {owner && <div className="page-actions">
          <label className="primary-action photo-file-action">Replace
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files[0] && onReplace(e.target.files[0])} />
          </label>
          <button className="danger-action" type="button" onClick={onDelete}>Delete photo</button>
        </div>}
      </section>
    </div>
  )
}
