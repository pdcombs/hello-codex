export default function EventAnalytics({ analytics }) {
  const values = [
    ['Categories', analytics?.categoryCount ?? 0],
    ['Participants', analytics?.participantCount ?? 0],
    ['Entries', analytics?.entryCount ?? 0],
  ]
  return (
    <dl className="event-analytics" aria-label="Event analytics">
      {values.map(([label, value]) => (
        <div key={label}>
          <dd>{value}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  )
}
