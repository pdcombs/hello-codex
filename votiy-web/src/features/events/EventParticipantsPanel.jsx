import { useEffect, useState } from 'react'
import EmptyState from '../../components/EmptyState.jsx'
import { ErrorState, LoadingState } from '../../components/PageStatus.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { archiveEventParticipantEntries, loadEventParticipants } from './events.graphql.js'
import EventParticipantCardList from './EventParticipantCardList.jsx'

export default function EventParticipantsPanel({
  eventId,
  loader = loadEventParticipants,
  removeParticipant = archiveEventParticipantEntries,
}) {
  const [state, setState] = useState({
    status: 'loading',
    saving: false,
    error: null,
    participants: [],
  })

  useEffect(() => {
    let active = true
    loader(eventId)
      .then((result) => {
        if (!active) return
        setState({ status: 'success', saving: false, error: null,
          participants: normalizeParticipants(result) })
      })
      .catch((error) => {
        if (!active) return
        setState({ status: 'error', saving: false, error, participants: [] })
      })
    return () => {
      active = false
    }
  }, [eventId, loader])

  async function onRemove(participant) {
    setState((current) => ({ ...current, saving: true, error: null }))
    try {
      await removeParticipant(participant.registrationId
        ? { eventId, registrationId: participant.registrationId }
        : { eventId, accountId: participant.accountId,
            idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-participant-remove` })
      setState((current) => ({
        ...current,
        saving: false,
        participants: current.participants.filter((item) => item.accountId !== participant.accountId),
      }))
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error }))
    }
  }

  return (
    <SectionCard title="Participants">
      {state.status === 'loading' && <LoadingState message="Loading participants…" />}
      {state.error && (
        <ErrorState title="Participants unavailable" message={state.error.message} />
      )}

      {state.status === 'success' && state.participants.length === 0 && (
        <EmptyState title="No participants yet"
          message="Participants appear here after you add an entry for their account. Use Add, then choose Entry." />
      )}

      {state.status === 'success' && state.participants.length > 0 && (
        <EventParticipantCardList participants={state.participants} onRemove={onRemove} disabled={state.saving} />
      )}
    </SectionCard>
  )
}

function normalizeParticipants(result) {
  if (Array.isArray(result?.participants)) return result.participants
  return (result?.registrations ?? []).map(normalizeRegistration)
}

function normalizeRegistration(registration) {
  if (!registration) return null
  return {
    accountId: registration.accountId ?? registration.id,
    registrationId: registration.id,
    displayName: registration.displayName ?? registration.email?.split('@')[0] ?? registration.phone ?? registration.accountId,
    email: registration.email ?? null,
    entries: registration.entries ?? Array.from({ length: registration.entryCount ?? 0 }, (_, index) => ({
      id: `${registration.id}-entry-${index + 1}`,
      title: `Entry ${index + 1}`,
    })),
    entryCount: registration.entryCount ?? registration.entries?.length ?? 0,
  }
}
