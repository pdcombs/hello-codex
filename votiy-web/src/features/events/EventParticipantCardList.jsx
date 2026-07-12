import EventParticipantCard from './EventParticipantCard.jsx'

export default function EventParticipantCardList({ participants, onRemove, disabled }) {
  return (
    <ul aria-label="Participants" className="participant-card-list">
      {participants.map((participant) => (
        <EventParticipantCard key={participant.accountId ?? participant.registrationId} participant={participant} onRemove={onRemove} disabled={disabled} />
      ))}
    </ul>
  )
}
