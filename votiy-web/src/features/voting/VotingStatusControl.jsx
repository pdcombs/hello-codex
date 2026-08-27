import { Link } from 'react-router-dom'
import { useState } from 'react'
import { setEventVotingStatus } from './voting.graphql.js'

export default function VotingStatusControl({ event, saver = setEventVotingStatus, onSaved = () => {} }) {
  const [state, setState] = useState({ saving: false, error: null, warning: false })
  const open = event.votingState?.status === 'OPEN'; const requested = open ? 'CLOSED' : 'OPEN'
  async function change() {
    setState({ saving: true, error: null, warning: false })
    try {
      const result = await saver({ eventId: event.id, status: requested, expectedVersion: event.votingState.version })
      setState({ saving: false, error: null, warning: requested === 'OPEN' && result.hasUnusedCodes === false })
      await onSaved(result.event)
    } catch (error) { setState({ saving: false, error, warning: false }) }
  }
  return <div className="voting-status-control">
    <button className="primary-action" type="button" onClick={change} disabled={state.saving}>
      {state.saving ? 'Updating…' : open ? 'Close Voting' : 'Open Voting'}
    </button>
    {state.warning && <p role="status">No unused voting codes remain. <Link to={`/events/${event.publicId}/settings`}>Manage voting codes</Link>.</p>}
    {state.error && <p role="alert">{state.error.message}</p>}
  </div>
}
