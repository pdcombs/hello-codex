import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestVotingAccess } from './voting.graphql.js'
import VotingCodeModal from './VotingCodeModal.jsx'

export default function VotingAccessButton({ event, requester = requestVotingAccess }) {
  const navigate = useNavigate(); const [state, setState] = useState({ pending: false, error: null, code: false })
  async function request(accessCode = null) {
    setState((current) => ({ ...current, pending: true, error: null }))
    try {
      const access = await requester({ eventId: event.id, accessCode })
      if (access.allowed) { navigate(`/events/${event.publicId}/vote`); return }
      if (access.decision === 'CODE_REQUIRED') { setState({ pending: false, error: accessCode ? new Error('That voting code is invalid or already used.') : null, code: true }); return }
      if (access.decision === 'SIGN_IN_REQUIRED' || access.decision === 'ACCOUNT_COMPLETION_REQUIRED') {
        navigate(`/sign-in?returnTo=${encodeURIComponent(`/events/${event.publicId}`)}`); return
      }
      const messages = { CLOSED: 'Voting is closed at this time.', REPEAT_LIMIT_REACHED: 'You have already reached the voting limit.',
        EVENT_UNAVAILABLE: 'This event is unavailable.' }
      setState({ pending: false, error: new Error(messages[access.decision] ?? 'You cannot vote at this time.'), code: false })
    } catch (error) { setState((current) => ({ ...current, pending: false, error })) }
  }
  return <>
    <div className="voting-access-action">
      <button className="primary-action" type="button" onClick={() => request()} disabled={state.pending}>
        {state.pending && !state.code ? 'Checking…' : 'Vote'}
      </button>
      {state.error && !state.code && <p role="alert">{state.error.message}</p>}
    </div>
    {state.code && <VotingCodeModal pending={state.pending} error={state.error}
      onCancel={() => setState({ pending: false, error: null, code: false })} onSubmit={request} />}
  </>
}
