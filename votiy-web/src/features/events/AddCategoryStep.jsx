import { FormField, FormSurface } from '../../components/Form.jsx'

export default function AddCategoryStep({ value, error, saving, generalError, onChange, onBack, onClose, onSubmit }) {
  return (
    <FormSurface className="unified-add-form" onSubmit={(event) => {
      event.preventDefault()
      onSubmit()
    }} noValidate>
      <FormField label="Category title" htmlFor="unified-category-title" error={error}>
        <input id="unified-category-title" name="title" value={value} maxLength="120" autoFocus
          onChange={(event) => onChange(event.target.value)} />
      </FormField>
      {generalError && !error && <p role="alert">{generalError.message}</p>}
      <div className="modal-actions">
        <button className="secondary-action" type="button" disabled={saving} onClick={onBack}>Back</button>
        <button className="secondary-action" type="button" disabled={saving} onClick={onClose}>Cancel</button>
        <button className="primary-action" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save category'}
        </button>
      </div>
    </FormSurface>
  )
}
