export default function EmptyState({ title, message, action = null }) {
  return (
    <section className="empty-state" aria-label={title}>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  )
}
