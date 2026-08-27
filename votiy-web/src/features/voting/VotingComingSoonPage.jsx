import { Link, useParams } from 'react-router-dom'

export default function VotingComingSoonPage() {
  const { publicId } = useParams()
  return <main id="main-content" className="page-shell" tabIndex="-1">
    <h1 data-page-title="true" tabIndex="-1">Voting feature coming soon</h1>
    <p>Your voting access passed. Ballot selection will arrive in a future update.</p>
    <Link className="secondary-action" to={`/events/${publicId}`}>Back to event</Link>
  </main>
}
