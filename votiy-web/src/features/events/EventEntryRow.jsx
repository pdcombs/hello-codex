export default function EventEntryRow({ entry, onRemove, iconOnly = false }) {
  async function confirmRemoval() {
    const confirmed = globalThis.confirm?.(`Remove and archive “${entry.title}”?`) ?? true
    if (confirmed) await onRemove?.(entry)
  }
  return (
    <li className="event-entry-row">
      <div><strong>{entry.title}</strong><span>Owned by {entry.ownerDisplayName}</span></div>
      {onRemove && <button className={iconOnly ? 'entry-delete-action' : 'secondary-action'} type="button"
        onClick={confirmRemoval} aria-label={iconOnly ? `Delete ${entry.title}` : undefined} title="Delete entry">
        {iconOnly ? <TrashIcon /> : 'Remove entry'}
      </button>}
    </li>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
    </svg>
  )
}
