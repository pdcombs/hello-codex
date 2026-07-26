import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import EventSearchResults from './EventSearchResults.jsx'
import useSearchPlaceholder from './useSearchPlaceholder.js'

export default function EventSearchDialog({ controller, triggerRef }) {
  const { state } = controller
  const navigate = useNavigate()
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const placeholder = useSearchPlaceholder(state.status !== 'closed' && !state.query)
  const close = useCallback(() => {
    controller.close()
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [controller, triggerRef])
  useEffect(() => {
    if (state.status === 'closed') return undefined
    inputRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') {
        const focusable = [...dialogRef.current.querySelectorAll('button,input,[href]')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state.status, close])
  if (state.status === 'closed') return null
  function select(event) { close(); navigate(`/events/${encodeURIComponent(event.publicId)}`) }
  return (
    <div className="event-search-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close()
    }}>
      <section ref={dialogRef} className="event-search-dialog" role="dialog" aria-modal="true" aria-labelledby="find-events-title">
        <header><h2 id="find-events-title">Find events</h2><button type="button" className="secondary-action" onClick={close}>Close</button></header>
        <input ref={inputRef} type="search" value={state.query} placeholder={placeholder}
          aria-label="Search event title, description, or location"
          onChange={(event) => controller.setQuery(event.target.value)} />
        <div className="event-search-status" role="status" aria-live="polite">
          {state.status === 'loading' && 'Searching events…'}
          {state.status === 'empty' && 'No events found.'}
          {state.status === 'error' && 'Events could not be loaded.'}
        </div>
        {state.status === 'error' && <button type="button" className="secondary-action" onClick={controller.retry}>Try again</button>}
        <EventSearchResults nodes={state.nodes} status={state.status} nextCursor={state.nextCursor}
          onLoadMore={controller.loadMore} onRetry={controller.loadMore} onSelect={select} />
      </section>
    </div>
  )
}
