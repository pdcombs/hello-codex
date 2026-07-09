export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="status-card" role="status">
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message }) {
  return (
    <div className="status-card status-card-error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  )
}
