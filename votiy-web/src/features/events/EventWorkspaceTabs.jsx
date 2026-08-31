import { Link, useLocation } from 'react-router-dom'

export default function EventWorkspaceTabs({ publicId }) {
  const { pathname } = useLocation()
  const tabs = [
    ['Entries', `/events/${publicId}`, true],
    ['Participants', `/events/${publicId}/participants`, false],
    ['Results', `/events/${publicId}/results`, false],
  ]
  return <nav className="event-workspace-tabs" aria-label="Event views" role="tablist">
    {tabs.map(([label, to, end]) => {
      const active = end ? pathname === to : pathname.startsWith(to)
      return <Link key={label} to={to} role="tab" aria-selected={active}
        className={active ? 'active' : undefined}>{label}</Link>
    })}
  </nav>
}
