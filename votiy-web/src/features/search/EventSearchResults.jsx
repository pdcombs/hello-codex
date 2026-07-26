import { useEffect, useRef } from 'react'

export default function EventSearchResults({ nodes, status, nextCursor, onLoadMore, onSelect, onRetry }) {
  const sentinel = useRef(null)
  useEffect(() => {
    if (!nextCursor || !globalThis.IntersectionObserver) return undefined
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onLoadMore() })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [nextCursor, onLoadMore])
  return (
    <div className="event-search-results">
      {nodes.map((event) => (
        <button type="button" className="event-search-result" key={event.publicId} onClick={() => onSelect(event)}>
          <strong>{event.title}</strong>
          {event.description && <span>{event.description}</span>}
          <small>{event.visibility === 'PRIVATE' ? 'Private event' : event.location}</small>
        </button>
      ))}
      <div ref={sentinel} aria-hidden="true" />
      {nextCursor && status !== 'loading-more' &&
        <button type="button" className="secondary-action" onClick={onLoadMore}>Load more events</button>}
      {status === 'loading-more' && <p role="status">Loading more events…</p>}
      {status === 'more-error' && <button type="button" className="secondary-action" onClick={onRetry}>Try again</button>}
    </div>
  )
}
