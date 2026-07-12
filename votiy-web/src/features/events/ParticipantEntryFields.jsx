import { FormField, FormGroup } from '../../components/Form.jsx'

export default function ParticipantEntryFields({ categories = [], count = 1, errors = {}, onAdd }) {
  const choices = categories.length ? categories : [{ id: 'default-category', title: 'Event participants', isDefault: true }]
  const defaultCategory = choices.find(({ isDefault }) => isDefault) ?? choices[0]
  return (
    <FormGroup legend="Entries">
      {Array.from({ length: count }, (_, index) => (
        <div className="entry-fields" key={index}>
          <FormField label={`Entry ${index + 1} title`} htmlFor={`entry-title-${index}`} error={errors[`entries.${index}.title`]}>
            <input id={`entry-title-${index}`} name={`entry-title-${index}`} defaultValue={`Entry ${index + 1}`} required />
          </FormField>
          <FormField label={`Entry ${index + 1} category`} htmlFor={`entry-category-${index}`} error={errors[`entries.${index}.categoryId`]}>
            <select id={`entry-category-${index}`} name={`entry-category-${index}`} defaultValue={defaultCategory?.id ?? ''} required>
              {choices.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
            </select>
          </FormField>
        </div>
      ))}
      {onAdd && <button className="secondary-action" type="button" onClick={onAdd}>Add another entry</button>}
    </FormGroup>
  )
}
