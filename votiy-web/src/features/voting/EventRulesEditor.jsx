import { useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import CategoryVotingRuleFields from './CategoryVotingRuleFields.jsx'

const localValue = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''

export default function EventRulesEditor({ event, saver, onSaved }) {
  const rules = event.voting?.rules
  const [form, setForm] = useState(() => ({
    opensAt: localValue(rules?.opensAt), closesAt: localValue(rules?.closesAt),
    accessPolicy: rules?.accessPolicy ?? 'UNRESTRICTED',
    unrestrictedRepeatPolicy: rules?.unrestrictedRepeatPolicy ?? 'UNLIMITED',
    maximumBallotsPerAccount: rules?.maximumBallotsPerAccount ?? 1,
    codeRequiresCompletedAccount: rules?.codeRequiresCompletedAccount ?? true,
    defaultCategoryRule: rules?.defaultCategoryRule ?? { method: 'SINGLE', minimumSelections: null, maximumSelections: null },
    categoryRules: Object.fromEntries((event.categories ?? []).map((category) => [category.id,
      rules?.categoryRules?.find((rule) => rule.categoryId === category.id)
        ?? { categoryId: category.id, method: rules?.defaultCategoryRule?.method ?? 'SINGLE',
          minimumSelections: rules?.defaultCategoryRule?.minimumSelections ?? null,
          maximumSelections: rules?.defaultCategoryRule?.maximumSelections ?? null }])),
  }))
  const [status, setStatus] = useState({ saving: false, error: null })
  async function submit(eventObject) {
    eventObject.preventDefault(); setStatus({ saving: true, error: null })
    try {
      const result = await saver({ eventId: event.id, expectedEventUpdatedAt: event.updatedAt,
        expectedRulesVersion: rules.version, opensAt: new Date(form.opensAt).toISOString(),
        closesAt: new Date(form.closesAt).toISOString(), accessPolicy: form.accessPolicy,
        unrestrictedRepeatPolicy: form.accessPolicy === 'UNRESTRICTED' ? form.unrestrictedRepeatPolicy : null,
        maximumBallotsPerAccount: form.accessPolicy === 'ACCOUNT' || (form.accessPolicy === 'CODE' && form.codeRequiresCompletedAccount)
          ? Number(form.maximumBallotsPerAccount) : null,
        codeRequiresCompletedAccount: form.accessPolicy === 'CODE' ? form.codeRequiresCompletedAccount : null,
        defaultCategoryRule: { categoryId: null, ...form.defaultCategoryRule },
        categoryRules: Object.values(form.categoryRules),
        idempotencyKey: crypto.randomUUID() })
      onSaved(result.event); setStatus({ saving: false, error: null })
    } catch (error) { setStatus({ saving: false, error }) }
  }
  return <section className="event-voting-rules" aria-labelledby="voting-rules-title">
    <h2 id="voting-rules-title">Voting rules</h2>
    <FormSurface onSubmit={submit}>
      <FormField label="Voting opens" htmlFor="voting-opens"><input required id="voting-opens" type="datetime-local"
        value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} /></FormField>
      <FormField label="Voting closes" htmlFor="voting-closes"><input required id="voting-closes" type="datetime-local"
        value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} /></FormField>
      <FormField label="Who can vote" htmlFor="voting-access"><select id="voting-access" value={form.accessPolicy}
        onChange={(e) => setForm({ ...form, accessPolicy: e.target.value })}>
        <option value="UNRESTRICTED">Anyone with link</option><option value="ACCOUNT">Account required</option>
        <option value="CODE">Voting code required</option></select></FormField>
      {form.accessPolicy === 'UNRESTRICTED' && <FormField label="Repeat voting" htmlFor="voting-repeat">
        <select id="voting-repeat" value={form.unrestrictedRepeatPolicy}
          onChange={(e) => setForm({ ...form, unrestrictedRepeatPolicy: e.target.value })}>
          <option value="UNLIMITED">Unlimited ballots</option><option value="BROWSER_LIMITED">One per browser</option>
        </select></FormField>}
      {form.accessPolicy === 'CODE' && <FormField label="Require completed account" htmlFor="voting-code-account">
        <input id="voting-code-account" type="checkbox" checked={form.codeRequiresCompletedAccount}
          onChange={(e) => setForm({ ...form, codeRequiresCompletedAccount: e.target.checked })} />
      </FormField>}
      {(form.accessPolicy === 'ACCOUNT' || (form.accessPolicy === 'CODE' && form.codeRequiresCompletedAccount)) &&
        <FormField label="Ballots allowed per account" htmlFor="voting-account-limit">
          <input id="voting-account-limit" type="number" min="1" max="100" value={form.maximumBallotsPerAccount}
            onChange={(e) => setForm({ ...form, maximumBallotsPerAccount: Number(e.target.value) })} />
        </FormField>}
      <CategoryVotingRuleFields prefix="default-rule" value={form.defaultCategoryRule}
        onChange={(defaultCategoryRule) => setForm({ ...form, defaultCategoryRule })} />
      {(event.categories ?? []).map((category) => <fieldset className="form-group" key={category.id}>
        <legend>{category.title}</legend>
        <CategoryVotingRuleFields prefix={`category-${category.id}`} value={form.categoryRules[category.id]}
          onChange={(rule) => setForm({ ...form, categoryRules: { ...form.categoryRules,
            [category.id]: { ...rule, categoryId: category.id } } })} />
      </fieldset>)}
      {status.error && <p role="alert">{status.error.message}</p>}
      <button className="primary-action" disabled={status.saving}>{status.saving ? 'Saving…' : 'Save voting rules'}</button>
    </FormSurface>
  </section>
}
