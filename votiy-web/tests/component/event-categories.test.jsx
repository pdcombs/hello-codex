import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventCategoryManager from '../../src/features/events/EventCategoryManager.jsx'
import { GraphqlClientError } from '../../src/lib/graphql.js'

const category = { id: 'cat-1', title: 'Event participants', isDefault: true }
const event = { id: 'evt-1', categories: [category] }

describe('event category manager', () => {
  it('renders empty and validates blank category title', async () => {
    render(<EventCategoryManager event={{ id: 'evt-1', categories: [] }} addCategory={vi.fn()} />)
    expect(screen.getByText('No categories available.')).toBeVisible()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add category' }))
    expect(screen.getByText('Enter a category title.')).toBeVisible()
  })

  it('shows loading, duplicate error, and successful category refresh', async () => {
    let resolve
    const pending = new Promise((done) => { resolve = done })
    const addCategory = vi.fn().mockReturnValueOnce(pending).mockRejectedValueOnce(new GraphqlClientError('Category titles must be unique.'))
    const onEventChange = vi.fn()
    render(<EventCategoryManager event={event} addCategory={addCategory} onEventChange={onEventChange} />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('New category title'), 'Desserts')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    resolve({ event: { ...event, categories: [...event.categories, { id: 'cat-2', title: 'Desserts' }] } })
    await vi.waitFor(() => expect(onEventChange).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Category titles must be unique.')
  })

  it('renames default category successfully', async () => {
    const renameCategory = vi.fn().mockResolvedValue({ event: { ...event, categories: [{ ...category, title: 'People' }] } })
    const onEventChange = vi.fn()
    render(<EventCategoryManager event={event} renameCategory={renameCategory} onEventChange={onEventChange} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    await user.clear(screen.getByLabelText('Category title'))
    await user.type(screen.getByLabelText('Category title'), 'People')
    await user.click(screen.getByRole('button', { name: 'Save category' }))
    expect(renameCategory).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1', title: 'People' }))
  })
})
