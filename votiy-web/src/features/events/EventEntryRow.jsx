export default function EventEntryRow({ entry, onRemove }) {
  async function confirmRemoval() {
    const confirmed = globalThis.confirm?.(`Remove and archive “${entry.title}”?`) ?? true
    if (confirmed) await onRemove?.(entry)
  }
  return (
    <li className="event-entry-row">
      <div><strong>{entry.title}</strong><span>Owned by {entry.ownerDisplayName}</span></div>
      {onRemove && <button className="secondary-action" type="button" onClick={confirmRemoval}>Remove entry</button>}
    </li>
  )
}
