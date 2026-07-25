import { FormField, FormSurface } from '../../components/Form.jsx'
import { resolveActiveCategories } from './unified-add-session.js'

export default function AddEntryCategoryStep({ categories, value, error, onBack, onClose, onSelect }) {
  const active = resolveActiveCategories(categories)
  const defaultCategory = active.find((category) => category.isDefault)
  const selection = active.some((category) => category.id === value) ? value : defaultCategory?.id ?? ''
  const unavailable = !defaultCategory

  return (
    <FormSurface className="unified-add-form" onSubmit={(event) => {
      event.preventDefault()
      if (!unavailable && selection) onSelect(selection)
    }} noValidate>
      {unavailable ? (
        <div className="unified-add-recovery" role="alert">
          <p>Default category unavailable. Refresh the event or repair event setup before adding an entry.</p>
        </div>
      ) : (
        <FormField label="Category" htmlFor="unified-entry-category" error={error}>
          <select id="unified-entry-category" name="categoryId" value={selection}
            onChange={(event) => onSelect(event.target.value, { advance: false })}>
            {active.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
          </select>
        </FormField>
      )}
      <div className="modal-actions">
        <button className="secondary-action" type="button" onClick={onBack}>Back</button>
        <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
        <button className="primary-action" type="submit" disabled={unavailable || !selection}>Next</button>
      </div>
    </FormSurface>
  )
}
