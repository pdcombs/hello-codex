export default function EventEntryRow({ entry }) {
  return (
    <li className="event-entry-row">
      <strong>{entry.title}</strong>
      <span>Owned by {entry.ownerDisplayName}</span>
    </li>
  )
}
