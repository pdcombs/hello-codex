import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventCategoryList from '../../src/features/events/EventCategoryList.jsx'
import RemoveCategoryDialog from '../../src/features/events/RemoveCategoryDialog.jsx'

const at = '2026-07-19T12:00:00.000Z'
const categories = [
  { id: 'cat-1', title: 'Desserts', updatedAt: at, entries: [{ id: 'entry-1', title: 'Pie', updatedAt: at }] },
  { id: 'cat-2', title: 'Drinks', updatedAt: at, entries: [] },
]

describe('remove category', () => {
  it('warns with entry count, cancels, then submits the exact snapshot', async () => {
    const removeCategory = vi.fn().mockResolvedValue({ event: { id: 'event-1', categories: [categories[1]] } })
    const onEventChange = vi.fn()
    const user = userEvent.setup()
    render(<EventCategoryList categories={categories} eventId="event-1" eventUpdatedAt={at} editable
      removeCategory={removeCategory} onEventChange={onEventChange} />)
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    await user.click(screen.getByRole('button', { name: 'Remove category' }))
    expect(screen.getByText(/remove 1 entry/i)).toBeVisible()
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(removeCategory).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Remove category' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove category' }))
    expect(removeCategory).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1',
      activeEntries: [{ entryId: 'entry-1', expectedUpdatedAt: at }] }))
    expect(onEventChange).toHaveBeenCalled()
  })

  it('disables removal and explains the final-category invariant', async () => {
    const user = userEvent.setup()
    render(<EventCategoryList categories={[categories[0]]} eventId="event-1" eventUpdatedAt={at} editable />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('button', { name: 'Remove category' })).toBeDisabled()
    expect(screen.getByText('Every event needs at least one category.')).toBeVisible()
  })

  it('focuses the dialog, closes with Escape, and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<EventCategoryList categories={categories} eventId="event-1" eventUpdatedAt={at} editable />)
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    const trigger = screen.getByRole('button', { name: 'Remove category' })
    await user.click(trigger)
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('traps focus, exposes conflict refresh, and closes from its backdrop', async () => {
    const onCancel = vi.fn()
    const onRefresh = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<RemoveCategoryDialog category={categories[1]} entryCount={0}
      error={{ code: 'CONFLICT', message: 'Category changed.' }} onCancel={onCancel}
      onConfirm={vi.fn()} onRefresh={onRefresh} />)
    expect(screen.getByText(/remove 0 entries/i)).toBeVisible()
    const refresh = screen.getByRole('button', { name: 'Refresh current event' })
    await user.click(refresh)
    expect(onRefresh).toHaveBeenCalledOnce()
    const remove = screen.getByRole('button', { name: 'Remove category' })
    refresh.focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(remove).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(refresh).toHaveFocus()
    fireEvent.mouseDown(container.querySelector('.dialog-backdrop'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('locks dismissal and controls while the removal is pending', async () => {
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<RemoveCategoryDialog category={categories[0]} entryCount={1} pending
      onCancel={onCancel} onConfirm={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(onCancel).not.toHaveBeenCalled()
  })
})
