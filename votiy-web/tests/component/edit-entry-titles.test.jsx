import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventCategoryList from '../../src/features/events/EventCategoryList.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

const at = '2026-07-19T12:00:00.000Z'
const category = { id: 'category-1', title: 'Desserts', updatedAt: at, entries: [
  { id: 'entry-1', title: 'Pie', ownerDisplayName: 'Peyton', updatedAt: at },
  { id: 'entry-2', title: 'Cake', ownerDisplayName: 'Alex', updatedAt: at },
] }

describe('edit entry titles', () => {
  it('submits multiple controlled titles once and refreshes from the response', async () => {
    const updateCategory = vi.fn().mockResolvedValue({ event: { id: 'event-1', categories: [] } })
    const onEventChange = vi.fn()
    const user = userEvent.setup()
    render(<EventCategoryList categories={[category]} eventId="event-1" editable
      updateCategory={updateCategory} onEventChange={onEventChange} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Entry title for Peyton'))
    await user.type(screen.getByLabelText('Entry title for Peyton'), 'Cherry Pie')
    await user.clear(screen.getByLabelText('Entry title for Alex'))
    await user.type(screen.getByLabelText('Entry title for Alex'), 'Chocolate Cake')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateCategory).toHaveBeenCalledTimes(1)
    expect(updateCategory).toHaveBeenCalledWith(expect.objectContaining({ entryTitles: [
      expect.objectContaining({ entryId: 'entry-1', title: 'Cherry Pie' }),
      expect.objectContaining({ entryId: 'entry-2', title: 'Chocolate Cake' }),
    ] }))
    expect(onEventChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-1' }))
  })

  it('highlights the exact server field and preserves all typed values', async () => {
    const error = new GraphqlClientError('Correct the highlighted fields.', { fieldErrors: [
      { field: 'entryTitles.1.title', code: 'too_big', message: 'Entry title is too long.' },
    ] })
    const updateCategory = vi.fn().mockRejectedValue(error)
    const user = userEvent.setup()
    render(<EventCategoryList categories={[category]} eventId="event-1" editable updateCategory={updateCategory} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Entry title for Peyton'))
    await user.type(screen.getByLabelText('Entry title for Peyton'), 'Changed Pie')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Entry title is too long.')).toBeVisible()
    expect(screen.getByLabelText('Entry title for Alex')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Entry title for Peyton')).toHaveValue('Changed Pie')
  })

  it('blocks a blank entry title locally without calling the API', async () => {
    const updateCategory = vi.fn()
    const user = userEvent.setup()
    render(<EventCategoryList categories={[category]} eventId="event-1" editable updateCategory={updateCategory} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Entry title for Peyton'))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Enter an entry title.')).toBeVisible()
    expect(updateCategory).not.toHaveBeenCalled()
  })
})
