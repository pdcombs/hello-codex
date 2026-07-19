import { useState } from 'react'
import { FormField, FormSurface } from '../../components/Form.jsx'
import EventEntryRow from './EventEntryRow.jsx'
import RemoveCategoryDialog from './RemoveCategoryDialog.jsx'
import { addEventCategory, archiveEventCategory, updateEventCategory } from './events.graphql.js'

export default function EventCategoryList({ categories = [], eventId, eventUpdatedAt, editable = false,
  addCategory = addEventCategory, updateCategory = updateEventCategory,
  removeCategory = archiveEventCategory,
  onEventChange = () => {}, onRefresh, onRemoveEntry, onAddEntry }) {
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [state, setState] = useState({ saving: false, error: null, titleError: null, entryErrors: {} })
  const [draft, setDraft] = useState({ title: '', entryTitles: {} })
  const [removal, setRemoval] = useState(null)

  function beginEdit(categoryId) {
    const category = categories.find(({ id }) => id === categoryId)
    setAdding(false)
    setEditingId(categoryId)
    setDraft({ title: category?.title ?? '', entryTitles: Object.fromEntries(
      (category?.entries ?? []).map((entry) => [entry.id, entry.title])) })
    setState({ saving: false, error: null, titleError: null, entryErrors: {} })
  }

  function cancelEdit() {
    setAdding(false)
    setEditingId(null)
    setState({ saving: false, error: null, titleError: null, entryErrors: {} })
  }

  async function confirmRemoval() {
    const category = removal.category
    setRemoval((current) => ({ ...current, pending: true, error: null }))
    try {
      const result = await removeCategory({ eventId, categoryId: category.id,
        expectedEventUpdatedAt: eventUpdatedAt, expectedCategoryUpdatedAt: category.updatedAt,
        activeEntries: (category.entries ?? []).map((entry) => ({ entryId: entry.id,
          expectedUpdatedAt: entry.updatedAt })),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-category-remove` })
      await onEventChange(result.event)
      setRemoval(null)
      cancelEdit()
    } catch (error) {
      setRemoval((current) => ({ ...current, pending: false, error }))
    }
  }

  async function saveCategory(event, categoryId = null) {
    event.preventDefault()
    const category = categories.find(({ id }) => id === categoryId)
    const title = categoryId ? draft.title.trim() : new FormData(event.currentTarget).get('title')?.trim()
    if (!title) {
      setState((current) => ({ ...current, titleError: 'Enter a category title.' }))
      return
    }
    const entryErrors = categoryId ? Object.fromEntries((category?.entries ?? []).flatMap((entry) => {
      const value = draft.entryTitles[entry.id]?.trim()
      if (!value) return [[entry.id, 'Enter an entry title.']]
      if (value.length > 160) return [[entry.id, 'Entry title must be 160 characters or fewer.']]
      return []
    })) : {}
    if (Object.keys(entryErrors).length > 0) {
      setState((current) => ({ ...current, entryErrors, error: new Error('Correct the highlighted entry titles.') }))
      return
    }
    setState({ saving: true, error: null, titleError: null, entryErrors: {} })
    try {
      const result = categoryId ? await updateCategory({ eventId, categoryId, title,
        expectedCategoryUpdatedAt: category.updatedAt,
        entryTitles: (category.entries ?? []).map((entry) => ({ entryId: entry.id,
          title: draft.entryTitles[entry.id].trim(), expectedUpdatedAt: entry.updatedAt })),
        idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-category` })
        : await addCategory({ eventId, title,
          idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-category` })
      await onEventChange(result.event)
      cancelEdit()
    } catch (error) {
      const titleError = error.fieldErrors?.find((item) => item.field === 'title')?.message ?? null
      const indexedErrors = Object.fromEntries((error.fieldErrors ?? []).flatMap((item) => {
        const match = /^entryTitles\.(\d+)\.title$/.exec(item.field)
        const entry = match ? category?.entries?.[Number(match[1])] : null
        return entry ? [[entry.id, item.message]] : []
      }))
      setState({ saving: false, error, titleError, entryErrors: indexedErrors })
    }
  }

  function categoryCard(category, isEditing = false) {
    return (
      <section className="section-card event-category-card" key={category.id}
        aria-labelledby={isEditing ? undefined : `category-${category.id}`}>
        {isEditing ? (
          <FormSurface className="category-edit-form" onSubmit={(event) => saveCategory(event, category.id)} noValidate>
            <FormField label="Category title" htmlFor={`category-title-${category.id}`} error={state.titleError}>
              <input id={`category-title-${category.id}`} name="title" value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} autoFocus />
            </FormField>
            <EntryList category={category} onRemoveEntry={onRemoveEntry} editable values={draft.entryTitles}
              errors={state.entryErrors} onTitleChange={(entryId, value) => setDraft((current) => ({ ...current,
                entryTitles: { ...current.entryTitles, [entryId]: value } }))} />
            {state.error && !state.titleError && Object.keys(state.entryErrors).length === 0 &&
              <div className="category-edit-error" role="alert">
                <p>{state.error.message}</p>
                {state.error.code === 'CONFLICT' && onRefresh && <button className="secondary-action" type="button"
                  onClick={() => onRefresh()}>Refresh current event</button>}
              </div>}
            <div className="category-edit-actions">
              <div className="category-remove-control">
                <button className="destructive-secondary-action" type="button" disabled={categories.length <= 1}
                  aria-describedby={categories.length <= 1 ? `category-remove-help-${category.id}` : undefined}
                  onClick={(event) => setRemoval({ category, trigger: event.currentTarget, pending: false, error: null })}>
                  Remove category
                </button>
                {categories.length <= 1 && <span id={`category-remove-help-${category.id}`}>
                  Every event needs at least one category.</span>}
              </div>
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
              {editable && <div className="category-card-actions">
                {(category.entries ?? []).length > 0 && <button className="secondary-action" type="button"
                  onClick={(event) => onAddEntry?.(category, event.currentTarget)}>Add entry</button>}
                <button className="secondary-action" type="button" onClick={() => beginEdit(category.id)}>Edit</button>
              </div>}
            </div>
            <div className="section-card-body">
              {(category.entries ?? []).length === 0 && editable
                ? <div className="category-entry-empty"><p>No entries in this category.</p>
                    <button className="primary-action" type="button"
                      onClick={(event) => onAddEntry?.(category, event.currentTarget)}>Add entry</button></div>
                : <EntryList category={category} />}
            </div>
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
        <button className="primary-action add-category-action" type="button"
          onClick={() => { setAdding(true); setState({ saving: false, error: null, titleError: null, entryErrors: {} }) }}>
          Add category
        </button>
      )}
      {removal && <RemoveCategoryDialog category={removal.category}
        entryCount={(removal.category.entries ?? []).length} pending={removal.pending} error={removal.error}
        onCancel={() => { const trigger = removal.trigger; setRemoval(null); requestAnimationFrame(() => trigger?.focus()) }}
        onConfirm={confirmRemoval} onRefresh={onRefresh} />}
    </div>
  )
}

function EntryList({ category, editable = false, onRemoveEntry, values = {}, errors = {}, onTitleChange }) {
  const entries = category.entries ?? []
  if (entries.length === 0) return <p>No entries in this category.</p>
  return (
    <ul className="record-list" aria-label={`${category.title} entries`}>
      {entries.map((entry) => <EventEntryRow key={entry.id} entry={entry}
        onRemove={editable ? onRemoveEntry : undefined} iconOnly={editable} editable={editable}
        value={values[entry.id] ?? entry.title} error={errors[entry.id]}
        onTitleChange={(value) => onTitleChange?.(entry.id, value)} />)}
    </ul>
  )
}
