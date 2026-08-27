import { FormField, FormSurface, TextInput } from '../../components/Form.jsx'

export default function VotingCodeModal({ pending = false, error = null, onCancel, onSubmit }) {
  return <div className="dialog-backdrop" role="presentation">
    <section className="voting-code-dialog" role="dialog" aria-modal="true" aria-labelledby="voting-code-title">
      <h2 id="voting-code-title">Enter voting code</h2>
      <p>This event requires an unused generated code.</p>
      <FormSurface onSubmit={(event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget).get('code')) }}>
        <FormField label="Voting code" htmlFor="voting-access-code" error={error?.message} fullWidth>
          <TextInput id="voting-access-code" name="code" autoComplete="one-time-code" autoFocus required />
        </FormField>
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-action" disabled={pending}>{pending ? 'Checking…' : 'Continue'}</button>
        </div>
      </FormSurface>
    </section>
  </div>
}
