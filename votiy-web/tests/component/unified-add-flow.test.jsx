import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EventWorkspaceLayout from '../../src/features/events/EventWorkspaceLayout.jsx'
import UnifiedAddSheet from '../../src/features/events/UnifiedAddSheet.jsx'
import { defaultCategory, ownerChoice, unifiedAddEvent } from '../support/unified-add-flow.js'

describe('unified Add flow', () => {
  it('launches owner chooser beside settings and restores focus on dismissal', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><EventWorkspaceLayout event={unifiedAddEvent()}><p>Content</p></EventWorkspaceLayout></MemoryRouter>)
    const add = screen.getByRole('button', { name: 'Add' })
    expect(add.nextElementSibling).toHaveAccessibleName('Event settings')
    await user.click(add)
    expect(screen.getByRole('dialog', { name: 'Add to event' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Category' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Entry' })).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(add).toHaveFocus())
  })

  it('hides Add from non-owner workspace', () => {
    render(<MemoryRouter><EventWorkspaceLayout event={unifiedAddEvent({ isOwner: false })}>
      <p>Public</p>
    </EventWorkspaceLayout></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('creates a category with stable idempotency and reloads', async () => {
    const categoryCreator = vi.fn().mockResolvedValue({})
    const onChanged = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<UnifiedAddSheet event={unifiedAddEvent()} categoryCreator={categoryCreator}
      keyFactory={() => 'category-key'} onChanged={onChanged} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Category' }))
    await user.click(screen.getByRole('button', { name: 'Save category' }))
    expect(screen.getByText('Enter a category title.')).toBeVisible()
    await user.type(screen.getByLabelText('Category title'), 'Main courses')
    await user.click(screen.getByRole('button', { name: 'Save category' }))
    expect(categoryCreator).toHaveBeenCalledWith({
      eventId: 'event-1', title: 'Main courses', idempotencyKey: 'category-key',
    })
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()
  })

  it('defaults by isDefault, allows override, and creates existing-owner entry', async () => {
    const entryCreator = vi.fn().mockResolvedValue({})
    const user = userEvent.setup()
    render(<UnifiedAddSheet event={unifiedAddEvent()} entryCreator={entryCreator}
      choicesLoader={() => Promise.resolve({ choices: [ownerChoice] })}
      keyFactory={() => 'entry-key'} onChanged={vi.fn()} onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Entry' }))
    expect(screen.getByLabelText('Category')).toHaveValue(defaultCategory.id)
    await user.selectOptions(screen.getByLabelText('Category'), 'category-alternate')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(await screen.findByRole('option', { name: /Peyton Person/ }))
    await user.type(screen.getByLabelText('Entry title'), 'Apple pie')
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(entryCreator).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-1', categoryId: 'category-alternate', accountId: 'account-1',
      title: 'Apple pie', idempotencyKey: 'entry-key',
    }))
  })

  it('blocks entry flow without active default and supports backdrop close', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<UnifiedAddSheet event={unifiedAddEvent({
      categories: [{ id: 'other', title: 'Other', isDefault: false }],
    })} onChanged={vi.fn()} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Entry' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Default category unavailable')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })
})
