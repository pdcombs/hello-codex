import { useRef, useState } from 'react'
import EventWorkspaceSummary from './EventWorkspaceSummary.jsx'
import EventWorkspaceTabs from './EventWorkspaceTabs.jsx'
import UnifiedAddSheet from './UnifiedAddSheet.jsx'

export default function EventWorkspaceLayout({ event, onChanged, children }) {
  const [adding, setAdding] = useState(false)
  const triggerRef = useRef(null)

  function openAdd(trigger) {
    triggerRef.current = trigger
    setAdding(true)
  }

  function closeAdd() {
    setAdding(false)
    requestAnimationFrame(() => triggerRef.current?.focus?.())
  }

  return <>
    <EventWorkspaceSummary event={event} onChanged={onChanged}
      onAdd={(clickEvent) => openAdd(clickEvent.currentTarget)} />
    <EventWorkspaceTabs publicId={event.publicId} />
    <section className="event-workspace-content" aria-live="polite">{children}</section>
    {event.isOwner && adding && <UnifiedAddSheet event={event} onChanged={onChanged} onClose={closeAdd} />}
  </>
}
