import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestVotingAccess } from './voting.graphql.js'

export default function useVotingAccessController(event, requester = requestVotingAccess) {
  const navigate = useNavigate(); const requesting = useRef(false)
  const [state, setState] = useState({ pending: false, error: null, code: false })
  async function request(accessCode = null) {
    if (requesting.current) return
    requesting.current = true; setState((current) => ({ ...current, pending: true, error: null }))
    try {
      const access = await requester({ eventId: event.id, accessCode })
      if (access.allowed) { navigate(`/events/${event.publicId}/vote`); return }
      if (access.decision === 'CODE_REQUIRED') {
        requesting.current = false
        setState({ pending: false, error: accessCode ? new Error('That voting code is invalid or already used.') : null,
          code: true, hasHistory: access.hasBallotHistory === true }); return
      }
      if (access.decision === 'SIGN_IN_REQUIRED' || access.decision === 'ACCOUNT_COMPLETION_REQUIRED') {
        navigate(`/sign-in?returnTo=${encodeURIComponent(`/events/${event.publicId}`)}`); return
      }
      const messages = { CLOSED: 'Voting is closed at this time.',
        REPEAT_LIMIT_REACHED: 'You have already reached the voting limit.', EVENT_UNAVAILABLE: 'This event is unavailable.' }
      requesting.current = false
      setState({ pending: false, error: new Error(messages[access.decision] ?? 'You cannot vote at this time.'), code: false })
    } catch (error) { requesting.current = false; setState((current) => ({ ...current, pending: false, error })) }
  }
  function cancel() { requesting.current = false; setState({ pending: false, error: null, code: false }) }
  return { state, request, cancel, navigate }
}
