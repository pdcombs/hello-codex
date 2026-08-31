import { useMemo, useRef, useState } from 'react'
import BallotCategorySection from './BallotCategorySection.jsx'
import BallotConfirmationSheet from './BallotConfirmationSheet.jsx'
import { submitEventBallot } from './voting.graphql.js'

export default function EventBallot({ event, submittedBallot = null, mayCastAnother = false,
  submitter = submitEventBallot }) {
  const categories = useMemo(() => (event.categories ?? []).filter((category) => category.entries?.length), [event.categories])
  const rules = event.voting?.rules
  const [choices, setChoices] = useState(() => choicesFromBallot(submittedBallot))
  const [completed, setCompleted] = useState(submittedBallot)
  const [castingAnother, setCastingAnother] = useState(!submittedBallot)
  const [confirming, setConfirming] = useState(false)
  const [state, setState] = useState({ status: 'idle', error: null })
  const attemptKey = useRef(createAttemptKey())
  const submitButtonRef = useRef(null)

  if (!rules) return <p role="alert">Voting rules are unavailable.</p>
  const readOnly = Boolean(completed && !castingAnother)
  const method = rules.defaultCategoryRule.method
  const displayedCategories = readOnly
    ? completed.categoryBallots.map((category) => {
      const liveCategory = categories.find((candidate) => candidate.id === category.categoryId)
      return {
      id: category.categoryId,
      title: category.categoryTitle ?? liveCategory?.title ?? 'Category',
      method: category.method ?? method,
      entries: [...category.entries]
        .sort((a, b) => a.selectionOrder - b.selectionOrder)
        .map((entry) => ({ id: entry.entryId, title: entry.entryTitle ??
          liveCategory?.entries.find((candidate) => candidate.id === entry.entryId)?.title ?? 'Entry' })),
      }
    })
    : categories

  function updateChoice(categoryId, entryIds) {
    if (readOnly) return
    setChoices((current) => ({ ...current, [categoryId]: entryIds }))
    setState({ status: 'idle', error: null })
  }

  function requestConfirmation(eventSubmit) {
    eventSubmit.preventDefault()
    if (!Object.values(choices).some((entryIds) => entryIds.length > 0)) {
      setState({ status: 'error', error: new Error('Select at least one entry before submitting your vote.') })
      return
    }
    const invalidMultiple = method === 'MULTIPLE' && Object.values(choices).some((entryIds) => entryIds.length > 0 &&
      rules.defaultCategoryRule.minimumSelections != null && entryIds.length < rules.defaultCategoryRule.minimumSelections)
    if (invalidMultiple) {
      setState({ status: 'error', error: new Error('Meet the selection minimum or clear that category before submitting.') })
      return
    }
    setConfirming(true)
  }

  async function confirmSubmission() {
    setState({ status: 'loading', error: null })
    try {
      const result = await submitter({ eventId: event.id, expectedRulesVersion: rules.version,
        expectedVotingStateVersion: event.votingState.version,
        categoryBallots: categories.map((category) => ({ categoryId: category.id, entryIds: choices[category.id] ?? [] })),
        idempotencyKey: attemptKey.current })
      const ballot = result.ballot ?? ballotFromChoices(event, choices, result.receipt, method)
      setCompleted(ballot); setChoices(choicesFromBallot(ballot)); setCastingAnother(false); setConfirming(false)
      setState({ status: 'success', error: null })
      requestAnimationFrame(() => document.querySelector('[data-ballot-complete]')?.focus())
    } catch (error) { setConfirming(false); setState({ status: 'error', error }) }
  }

  function startAnother() {
    setChoices({}); setCastingAnother(true); setState({ status: 'idle', error: null }); attemptKey.current = createAttemptKey()
  }

  return <>
    {readOnly && <div className="ballot-complete" role="status" tabIndex="-1" data-ballot-complete>
      <p className="eyebrow">Voting complete</p><h2>Your vote was recorded</h2>
      <p>Review your submitted choices below.</p>
      {mayCastAnother && <button className="secondary-action" type="button" onClick={startAnother}>Cast another vote</button>}
    </div>}
    <form className={`ballot-form${readOnly ? ' ballot-form-readonly' : ''}`} onSubmit={requestConfirmation} noValidate>
      {displayedCategories.map((category) => <BallotCategorySection key={category.id} category={category}
        method={readOnly ? category.method : method}
        rule={rules.defaultCategoryRule} entryIds={choices[category.id] ?? []} readOnly={readOnly}
        onChange={(entryIds) => updateChoice(category.id, entryIds)} />)}
      {!categories.length && <p className="ballot-empty">This event has no entries available for voting.</p>}
      {state.error && <div className="form-alert ballot-error" role="alert"><p>{ballotErrorMessage(state.error)}</p></div>}
      {!readOnly && <div className="ballot-submit-space" aria-hidden="true" />}
      {!readOnly && <div className="ballot-submit-bar"><button ref={submitButtonRef} className="primary-action" type="submit"
        disabled={state.status === 'loading' || !categories.length}>Submit vote</button></div>}
    </form>
    {confirming && <BallotConfirmationSheet pending={state.status === 'loading'} triggerRef={submitButtonRef}
      onCancel={() => setConfirming(false)} onConfirm={confirmSubmission} />}
  </>
}

function choicesFromBallot(ballot) {
  if (!ballot) return {}
  return Object.fromEntries(ballot.categoryBallots.map((category) => [category.categoryId,
    [...category.entries].sort((a, b) => a.selectionOrder - b.selectionOrder).map((entry) => entry.entryId)]))
}

function ballotFromChoices(event, choices, receipt, method) {
  return { id: receipt?.id, submittedAt: receipt?.submittedAt, categoryBallots: (event.categories ?? []).map((category, categoryOrder) => ({
    categoryId: category.id, categoryTitle: category.title, categoryOrder, method,
    entries: (choices[category.id] ?? []).map((entryId, selectionOrder) => ({ entryId, selectionOrder,
      entryTitle: category.entries.find((entry) => entry.id === entryId)?.title ?? 'Entry' })),
  })) }
}

function createAttemptKey() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}` }

function ballotErrorMessage(error) {
  const messages = { VOTING_CLOSED: 'Voting closed before your vote could be submitted. Your selections remain here for review.',
    CONFLICT: 'Event or voting rules changed. Refresh before trying again.',
    BALLOT_LIMIT_REACHED: 'You have reached the voting limit for this event.' }
  return messages[error.code] ?? error.message
}
