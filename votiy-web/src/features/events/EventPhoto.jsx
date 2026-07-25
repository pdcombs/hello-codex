import { useRef, useState } from 'react'
import EventPhotoDialog from './EventPhotoDialog.jsx'
import { deleteEventPhoto, uploadEventPhoto } from './event-photo.http.js'

export default function EventPhoto({ event, owner = false, onChanged }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const triggerRef = useRef(null)
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  async function replace(file) {
    setStatus('loading')
    setError(null)
    try {
      await uploadEventPhoto(event.id, file)
      await onChanged?.()
      setStatus('success')
    } catch (nextError) {
      setError(nextError)
      setStatus('error')
    }
  }
  async function remove() {
    if (!window.confirm('Delete this event photo?')) return
    setStatus('loading')
    try {
      await deleteEventPhoto(event.id)
      close()
      await onChanged?.()
    } catch (nextError) {
      setError(nextError)
      setStatus('error')
    }
  }
  if (!event.photo) {
    return owner ? (
      <label className="event-photo event-photo-fallback" aria-label={`Add a photo for ${event.title}`}>
        <span aria-hidden="true">{event.title.slice(0, 1).toUpperCase()}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files[0] && replace(e.target.files[0])} />
        {status === 'loading' && <span className="sr-only" role="status">Uploading photo…</span>}
        {error && <span className="sr-only" role="alert">{error.message}</span>}
      </label>
    ) : <div className="event-photo event-photo-fallback" aria-label={`${event.title} has no photo`}>{event.title.slice(0, 1).toUpperCase()}</div>
  }
  return <>
    <button ref={triggerRef} className="event-photo" type="button" onClick={() => setOpen(true)}
      aria-label={`View ${event.title} photo`}><img src={event.photo.url} alt="" /></button>
    {open && <EventPhotoDialog event={event} owner={owner} onClose={close} onReplace={replace} onDelete={remove} />}
    {status === 'loading' && <span className="sr-only" role="status">Updating photo…</span>}
    {error && <span className="sr-only" role="alert">{error.message}</span>}
  </>
}
