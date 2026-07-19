import { useMemo, useState } from 'react'
import { FormSurface } from '../../components/Form.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { submitEventBallot } from './voting.graphql.js'

function categoryRule(rules, categoryId) {
  return rules.categoryRules.find((rule) => rule.categoryId === categoryId) ?? rules.defaultCategoryRule
}

export default function EventBallot({ event, submitter = submitEventBallot }) {
  const capability = event.voting
  const categories = useMemo(() => (event.categories ?? []).filter(({ entries }) => entries.length > 0), [event.categories])
  const [choices, setChoices] = useState({})
  const [accessCode, setAccessCode] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState({ status: 'idle', error: null })
  if (!capability?.rules) return null
  if (!capability.canVote) return <SectionCard title="Voting"><p>{statusMessage(capability.votingStatus, capability.reasonCode)}</p></SectionCard>

  function toggle(categoryId, entryId, checked, method) {
    setChoices((current) => {
      const values = current[categoryId] ?? []
      return { ...current, [categoryId]: method === 'SINGLE' ? [entryId]
        : checked ? [...new Set([...values, entryId])] : values.filter((id) => id !== entryId) }
    })
  }

  async function submit(submitEvent) {
    submitEvent.preventDefault(); setState({ status: 'loading', error: null })
    try {
      await submitter({ eventId: event.id, expectedRulesVersion: capability.rules.version,
        categoryBallots: categories.map((category) => ({ categoryId: category.id, entryIds: choices[category.id] ?? [] })),
        accessCode: capability.rules.accessPolicy === 'CODE' && !capability.hasEventAccess ? accessCode : null,
        provisionalVoter: capability.rules.accessPolicy === 'CODE' && !capability.rules.codeRequiresCompletedAccount
          && !capability.hasEventAccess ? { email, phone: phone || null } : null,
        idempotencyKey: crypto.randomUUID() })
      setState({ status: 'success', error: null })
    } catch (error) { setState({ status: 'error', error }) }
  }

  if (state.status === 'success') return <SectionCard title="Vote recorded"><p>Your ballot was submitted.</p></SectionCard>
  return <SectionCard title="Vote">
    <FormSurface onSubmit={submit}>
      {capability.rules.accessPolicy === 'CODE' && !capability.hasEventAccess && <div className="form-group">
        <label htmlFor="voting-code">Voting code</label>
        <input id="voting-code" required pattern="[a-z0-9]{6}" maxLength="6" value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toLowerCase())} />
        {!capability.rules.codeRequiresCompletedAccount && <>
          <label htmlFor="voter-email">Email</label><input id="voter-email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="voter-phone">Phone <span className="form-optional">Optional</span></label>
          <input id="voter-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </>}
      </div>}
      {capability.rules.unrestrictedRepeatPolicy === 'BROWSER_LIMITED' &&
        <p className="form-help">Limited to one ballot in this browser. Clearing browser data may reset this limit.</p>}
      {capability.remainingBallots != null && <p className="form-help">{capability.remainingBallots} ballots remaining.</p>}
      {categories.map((category) => {
        const rule = categoryRule(capability.rules, category.id)
        return <fieldset className="form-group ballot-category" key={category.id}>
          <legend>{category.title}</legend>
          {rule.method === 'RANKING' ? category.entries.map((_, rank) => <label key={rank}>
            <span>{`Rank ${rank + 1}`}</span>
            <select aria-label={`${category.title} rank ${rank + 1}`} value={(choices[category.id] ?? [])[rank] ?? ''}
              onChange={(e) => setChoices((current) => { const values = [...(current[category.id] ?? [])]
                values[rank] = e.target.value; return { ...current, [category.id]: values } })} required>
              <option value="">Choose entry</option>
              {category.entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
            </select>
          </label>) : category.entries.map((entry) => <label className="ballot-choice" key={entry.id}>
            <input type={rule.method === 'SINGLE' ? 'radio' : 'checkbox'} name={`category-${category.id}`}
              value={entry.id} checked={(choices[category.id] ?? []).includes(entry.id)}
              onChange={(e) => toggle(category.id, entry.id, e.target.checked, rule.method)} />
            <span>{entry.title}</span>
          </label>)}
          {rule.method === 'MULTIPLE' && <p className="form-help">Choose {rule.minimumSelections}–{rule.maximumSelections}.</p>}
        </fieldset>
      })}
      {state.error && <p role="alert">{state.error.message}</p>}
      <button className="primary-action" disabled={state.status === 'loading' || categories.length === 0}>
        {state.status === 'loading' ? 'Submitting…' : 'Submit ballot'}
      </button>
    </FormSurface>
  </SectionCard>
}

function statusMessage(status, reasonCode) {
  if (reasonCode === 'AUTHENTICATION_REQUIRED') return 'Sign in to vote in this event.'
  if (reasonCode === 'ACCOUNT_REQUIREMENTS_NOT_MET') return 'Add both email and phone to your account before voting.'
  if (reasonCode === 'BALLOT_LIMIT_REACHED') return 'This account has reached its ballot limit.'
  if (status === 'UPCOMING') return 'Voting has not opened yet.'
  if (status === 'CLOSED') return 'Voting has closed.'
  return 'Voting has not been configured.'
}
