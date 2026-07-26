export default function EventSearchButton({ onClick, buttonRef }) {
  return (
    <button ref={buttonRef} type="button" className="event-search-trigger" aria-label="Find events" onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </svg>
    </button>
  )
}
