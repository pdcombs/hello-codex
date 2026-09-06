import { requestVotingAccess } from './voting.graphql.js'
import VotingCodeModal from './VotingCodeModal.jsx'
import useVotingAccessController from './useVotingAccessController.js'

export function VotingOpenBanner({ controller }) {
  return <button className="voting-open-banner" type="button" onClick={() => controller.request()}
    disabled={controller.state.pending} aria-busy={controller.state.pending}>
    Voting is now open. Click here to vote
  </button>
}

export default function VotingAccessButton({ event, requester = requestVotingAccess, controller = null }) {
  const localController = useVotingAccessController(event, requester); const access = controller ?? localController
  return <>
    <div className="voting-access-action">
      <button className="primary-action" type="button" onClick={() => access.request()} disabled={access.state.pending}>
        {access.state.pending && !access.state.code ? 'Checking…' : 'Vote'}
      </button>
      {access.state.error && !access.state.code && <p role="alert">{access.state.error.message}</p>}
    </div>
    {access.state.code && <VotingCodeModal pending={access.state.pending} error={access.state.error}
      canViewPrevious={access.state.hasHistory}
      onViewPrevious={() => access.navigate(`/events/${event.publicId}/votes`)}
      onCancel={access.cancel} onSubmit={access.request} />}
  </>
}
