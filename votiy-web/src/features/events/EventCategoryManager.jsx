import { useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import SectionCard from '../../components/SectionCard.jsx'
import { addEventCategory, renameEventCategory } from './events.graphql.js'

export default function EventCategoryManager({ event, addCategory = addEventCategory,
  renameCategory = renameEventCategory, onEventChange = () => {} }) {
  const [state, setState] = useState({ saving: false, error: null, fieldErrors: {}, renamingId: null })
  const categories = event.categories ?? []

  async function mutate(action, input) {
    const title = input.title.trim()
    if (!title) { setState((current) => ({ ...current, fieldErrors: { title: 'Enter a category title.' } })); return }
    setState((current) => ({ ...current, saving: true, error: null, fieldErrors: {} }))
    try {
      const result = await action({ ...input, title, eventId: event.id,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-category` })
      onEventChange(result.event)
      setState({ saving: false, error: null, fieldErrors: {}, renamingId: null })
    } catch (error) {
      const fieldErrors = Object.fromEntries((error.fieldErrors ?? []).map((item) => [item.field, item.message]))
      setState((current) => ({ ...current, saving: false, error, fieldErrors }))
    }
  }

  return (
    <SectionCard title="Categories">
      {categories.length === 0 && <p>No categories available.</p>}
      <ul className="record-list" aria-label="Categories">
        {categories.map((category) => (
          <li key={category.id}>
            <strong>{category.title}</strong>{category.isDefault && <span>Default</span>}
            {state.renamingId === category.id ? (
              <FormSurface onSubmit={(event_) => { event_.preventDefault(); mutate(renameCategory,
                { categoryId: category.id, title: new FormData(event_.currentTarget).get('title') }) }} noValidate>
                <FormField label="Category title" htmlFor={`rename-category-${category.id}`} error={state.fieldErrors.title}>
                  <input id={`rename-category-${category.id}`} name="title" defaultValue={category.title} />
                </FormField>
                <button type="submit" disabled={state.saving}>Save category</button>
                <button type="button" onClick={() => setState((current) => ({ ...current, renamingId: null }))}>Cancel</button>
              </FormSurface>
            ) : <button type="button" onClick={() => setState((current) => ({ ...current, renamingId: category.id, error: null }))}>Rename</button>}
          </li>
        ))}
      </ul>
      <FormSurface onSubmit={(event_) => { event_.preventDefault(); mutate(addCategory,
        { title: new FormData(event_.currentTarget).get('title') }) }} noValidate>
        <FormField label="New category title" htmlFor="new-category-title" error={state.fieldErrors.title}>
          <input id="new-category-title" name="title" />
        </FormField>
        <button type="submit" disabled={state.saving}>{state.saving ? 'Saving…' : 'Add category'}</button>
      </FormSurface>
      {state.error && Object.keys(state.fieldErrors).length === 0 && <p role="alert">{state.error.message}</p>}
    </SectionCard>
  )
}
