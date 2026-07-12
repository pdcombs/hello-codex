import { useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import EventEntryRow from './EventEntryRow.jsx'
import { addEventCategory, renameEventCategory } from './events.graphql.js'

export default function EventCategoryList({ categories = [], eventId, editable = false,
  addCategory = addEventCategory, renameCategory = renameEventCategory,
  onEventChange = () => {}, onRemoveEntry }) {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [state, setState] = useState({ saving: false, error: null, titleError: null })

  function beginEdit(categoryId) {
    setAdding(false)
    setEditingId(categoryId)
    setState({ saving: false, error: null, titleError: null })
  }

  function cancelEdit() {
    setAdding(false)
    setEditingId(null)
    setState({ saving: false, error: null, titleError: null })
  }

  async function saveCategory(event, categoryId = null) {
    event.preventDefault()
    const title = new FormData(event.currentTarget).get('title')?.trim()
    if (!title) {
      setState((current) => ({ ...current, titleError: 'Enter a category title.' }))
      return
    }
    setState({ saving: true, error: null, titleError: null })
    try {
      const action = categoryId ? renameCategory : addCategory
      const result = await action({ eventId, ...(categoryId && { categoryId }), title,
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-category` })
      await onEventChange(result.event)
      cancelEdit()
    } catch (error) {
      const titleError = error.fieldErrors?.find((item) => item.field === 'title')?.message ?? null
      setState({ saving: false, error, titleError })
    }
  }

  function categoryCard(category, isEditing = false) {
    return (
      <section className="section-card event-category-card" key={category.id}
        aria-labelledby={isEditing ? undefined : `category-${category.id}`}>
        {isEditing ? (
          <FormSurface className="category-edit-form" onSubmit={(event) => saveCategory(event, category.id)} noValidate>
            <FormField label="Category title" htmlFor={`category-title-${category.id}`} error={state.titleError}>
              <input id={`category-title-${category.id}`} name="title" defaultValue={category.title} autoFocus />
            </FormField>
            <EntryList category={category} onRemoveEntry={onRemoveEntry} editable />
            {state.error && !state.titleError && <p role="alert">{state.error.message}</p>}
            <div className="category-edit-actions">
              <button className="secondary-action" type="button" onClick={cancelEdit}>Cancel</button>
              <button className="primary-action" type="submit" disabled={state.saving}>
                {state.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </FormSurface>
        ) : (
          <>
            <div className="section-card-head">
              <h2 id={`category-${category.id}`}>{category.title}</h2>
              {editable && <button className="secondary-action" type="button"
                onClick={() => beginEdit(category.id)}>Edit</button>}
            </div>
            <div className="section-card-body"><EntryList category={category} /></div>
          </>
        )}
      </section>
    )
  }

  return (
    <div className="event-category-area">
      {categories.length === 0 && !adding && <p>No categories available.</p>}
      <div className="event-category-grid" aria-label="Event categories">
        {categories.map((category) => categoryCard(category, editingId === category.id))}
        {adding && (
          <section className="section-card event-category-card event-category-card-new">
            <FormSurface className="category-edit-form" onSubmit={(event) => saveCategory(event)} noValidate>
              <FormField label="Category title" htmlFor="new-category-title" error={state.titleError}>
                <input id="new-category-title" name="title" autoFocus />
              </FormField>
              <p>No entries in this category.</p>
              {state.error && !state.titleError && <p role="alert">{state.error.message}</p>}
              <div className="category-edit-actions">
                <button className="secondary-action" type="button" onClick={cancelEdit}>Cancel</button>
                <button className="primary-action" type="submit" disabled={state.saving}>
                  {state.saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </FormSurface>
          </section>
        )}
      </div>
      {editable && !adding && editingId === null && (
        <button className="secondary-action add-category-action" type="button"
          onClick={() => { setAdding(true); setState({ saving: false, error: null, titleError: null }) }}>
          Add category
        </button>
      )}
    </div>
  )
}

function EntryList({ category, editable = false, onRemoveEntry }) {
  const entries = category.entries ?? []
  if (entries.length === 0) return <p>No entries in this category.</p>
  return (
    <ul className="record-list" aria-label={`${category.title} entries`}>
      {entries.map((entry) => <EventEntryRow key={entry.id} entry={entry}
        onRemove={editable ? onRemoveEntry : undefined} iconOnly={editable} />)}
    </ul>
  )
}
