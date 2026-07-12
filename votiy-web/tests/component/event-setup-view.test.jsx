import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventCategoryList from '../../src/features/events/EventCategoryList.jsx'
import EventSetupTabs from '../../src/features/events/EventSetupTabs.jsx'
import { readEntries } from '../../src/features/events/participant-entry-form.js'

const categories = [
  { id: 'cat-1', title: 'Desserts', entries: [{ id: 'entry-1', title: 'Apple Pie', ownerDisplayName: 'Peyton' }] },
  { id: 'cat-2', title: 'Drinks', entries: [] },
]

describe('grouped event setup view', () => {
  it('renders grouped entry ownership, empty categories, and no contact data', () => {
    render(<EventCategoryList categories={categories} />)
    expect(screen.getByRole('heading', { name: 'Desserts' })).toBeVisible()
    expect(screen.getByText('Apple Pie')).toBeVisible()
    expect(screen.getByText('Owned by Peyton')).toBeVisible()
    expect(screen.getByText('No entries in this category.')).toBeVisible()
    expect(document.body.textContent).not.toMatch(/@|\+1555/)
  })

  it('handles omitted category and entry form data safely', () => {
    const { unmount } = render(<EventCategoryList />)
    expect(screen.getByText('No categories available.')).toBeVisible()
    unmount()
    expect(readEntries(new FormData(), 1)).toEqual([{ title: '', categoryId: '' }])
  })

  it('keeps view cards read-only and edits categories with icon entry deletion', async () => {
    const renameCategory = vi.fn().mockResolvedValue({
      event: { id: 'event-1', categories: [{ ...categories[0], title: 'Baked goods' }] },
    })
    const onEventChange = vi.fn()
    const onRemoveEntry = vi.fn()
    const user = userEvent.setup()
    render(<EventCategoryList categories={[categories[0]]} eventId="event-1" editable
      renameCategory={renameCategory} onEventChange={onEventChange} onRemoveEntry={onRemoveEntry} />)

    expect(screen.queryByRole('button', { name: /delete apple pie/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Category title')).toHaveValue('Desserts')
    expect(screen.getByRole('button', { name: /delete apple pie/i })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Remove entry' })).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('Category title'))
    await user.type(screen.getByLabelText('Category title'), 'Baked goods')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(renameCategory).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1', categoryId: 'cat-1', title: 'Baked goods',
    }))
    expect(onEventChange).toHaveBeenCalled()
  })

  it('adds a draft category card at the bottom and saves it', async () => {
    const addCategory = vi.fn().mockResolvedValue({ event: { id: 'event-1', categories } })
    const user = userEvent.setup()
    render(<EventCategoryList categories={categories} eventId="event-1" editable addCategory={addCategory} />)

    await user.click(screen.getByRole('button', { name: 'Add category' }))
    const title = screen.getByLabelText('Category title')
    await user.type(title, 'Main courses')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(addCategory).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1', title: 'Main courses',
    }))
  })

  it('waits for the hydrated event refresh before leaving edit mode', async () => {
    let finishRefresh
    const onEventChange = vi.fn(() => new Promise((resolve) => { finishRefresh = resolve }))
    const renameCategory = vi.fn().mockResolvedValue({ event: { id: 'event-1', categories: [] } })
    const user = userEvent.setup()
    render(<EventCategoryList categories={[categories[0]]} eventId="event-1" editable
      renameCategory={renameCategory} onEventChange={onEventChange} />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    finishRefresh()
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible())
  })

  it('provides accessible responsive setup and participant tabs', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<EventSetupTabs activeTab="setup" onChange={onChange}
      setup={<EventCategoryList categories={categories} />} participants={<p>Participant summary</p>} />)
    expect(screen.getByRole('tab', { name: 'Setup' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Participants' }))
    expect(onChange).toHaveBeenCalledWith('participants')
    rerender(<EventSetupTabs activeTab="participants" onChange={onChange}
      setup={<EventCategoryList categories={categories} />} participants={<p>Participant summary</p>} />)
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Participants')
    expect(screen.getByText('Participant summary')).toBeVisible()
  })
})
