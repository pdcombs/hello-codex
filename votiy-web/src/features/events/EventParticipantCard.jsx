export default function EventParticipantCard({ participant, onRemove, disabled = false }) {
  async function confirmRemoval() {
    const confirmed = globalThis.confirm?.(
      `Remove ${participant.displayName} and archive all ${participant.entryCount} entries from this event?`,
    ) ?? true
    if (confirmed) await onRemove?.(participant)
  }

  return (
    <li className="participant-card">
      <div className="participant-card-content">
        <h3>{participant.displayName}</h3>
        <p className="participant-card-email">{participant.email ?? 'Email unavailable'}</p>
        <ul aria-label={`${participant.displayName} entries`} className="participant-entry-list">
          {participant.entries.map((entry) => <li key={entry.id}>{entry.title}</li>)}
        </ul>
      </div>
      <div className="participant-card-actions">
        <strong className="participant-entry-count" aria-label={`${participant.entryCount} entries`}>
          {participant.entryCount}
        </strong>
        {onRemove && <button className="secondary-action" type="button" onClick={confirmRemoval} disabled={disabled}>
          Remove participant
        </button>}
      </div>
    </li>
  )
}
