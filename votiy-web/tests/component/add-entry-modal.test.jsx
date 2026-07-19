import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddEntryModal from '../../src/features/events/AddEntryModal.jsx'
import EventCategoryList from '../../src/features/events/EventCategoryList.jsx'

const category = { id: 'cat-1', title: 'Entrants', entries: [] }
const choice = { accountId: 'acct-1', displayName: 'Peyton Person', email: 'peyton@example.test',
  phone: null, isEventParticipant: true }

describe('add entry modal', () => {
  it('prompts empty category and saves one existing-owner entry', async () => {
    const onAddEntry = vi.fn()
    const user = userEvent.setup()
    render(<EventCategoryList categories={[category]} editable onAddEntry={onAddEntry} />)
    await user.click(screen.getByRole('button', { name: 'Add entry' }))
    expect(onAddEntry).toHaveBeenCalledWith(category, expect.any(HTMLElement))

    const creator = vi.fn().mockResolvedValue({ createdEntries: [] })
    const onSaved = vi.fn().mockResolvedValue(undefined)
    const { unmount } = render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [choice] })} creator={creator}
      onSaved={onSaved} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Who is this entry for?' })).toBeVisible()
    await user.click(await screen.findByRole('option', { name: /Peyton Person/ }))
    expect(screen.queryByText(/Category:/)).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Entry title'), 'Apple pie')
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(creator).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1',
      accountId: 'acct-1', title: 'Apple pie' }))
    expect(onSaved).toHaveBeenCalled()
    unmount()
  })

  it('validates title and preserves owner after save failure', async () => {
    const creator = vi.fn().mockRejectedValue(new Error('Save failed.'))
    const user = userEvent.setup()
    render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [choice] })} creator={creator}
      onSaved={vi.fn()} onClose={vi.fn()} />)
    await user.click(await screen.findByRole('option', { name: /Peyton Person/ }))
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(screen.getByText('Enter an entry title.')).toBeVisible()
    await user.type(screen.getByLabelText('Entry title'), 'Cake')
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed.')
    expect(screen.getByText(/Entry owner:/)).toHaveTextContent('Peyton Person')
    expect(screen.getByLabelText('Entry title')).toHaveValue('Cake')
  })

  it('traps focus, supports owner arrow navigation, and closes with Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const secondChoice = { ...choice, accountId: 'acct-2', displayName: 'Second Person' }
    render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [choice, secondChoice] })} creator={vi.fn()}
      onSaved={vi.fn()} onClose={onClose} />)
    const first = await screen.findByRole('option', { name: /Peyton Person/ })
    const second = screen.getByRole('option', { name: /Second Person/ })
    first.focus()
    await user.keyboard('{ArrowDown}')
    expect(second).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(first).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes from backdrop click but stays open for sheet content clicks', async () => {
    const onClose = vi.fn()
    render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [] })} creator={vi.fn()}
      onSaved={vi.fn()} onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Who is this entry for?' })
    fireEvent.click(screen.getByRole('heading', { name: 'Who is this entry for?' }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('sends provisional owner, handles field errors, Back, and close controls', async () => {
    const onClose = vi.fn()
    const creator = vi.fn().mockRejectedValue(Object.assign(new Error('Invalid title'), {
      fieldErrors: [{ field: 'title', message: 'Title is too long.' }],
    }))
    const user = userEvent.setup()
    render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [] })} creator={creator}
      onSaved={vi.fn()} onClose={onClose} />)
    await user.type(screen.getByLabelText('Search by email or phone'), 'new@example.test')
    await user.click(screen.getByRole('button', { name: 'Create new account' }))
    await user.type(screen.getByLabelText('Display name'), 'New Person')
    await user.click(screen.getByRole('button', { name: 'Use new participant' }))
    await user.type(screen.getByLabelText('Entry title'), 'Pie')
    await user.click(screen.getByRole('button', { name: 'Save entry' }))
    expect(await screen.findByText('Title is too long.')).toBeVisible()
    expect(creator).toHaveBeenCalledWith(expect.objectContaining({ provisionalOwner: {
      displayName: 'New Person', email: 'new@example.test', phone: null,
    } }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Who is this entry for?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Close add entry' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('traps Tab at both dialog boundaries and ignores close while saving', async () => {
    let resolveCreate
    const creator = vi.fn(() => new Promise((resolve) => { resolveCreate = resolve }))
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<AddEntryModal eventId="event-1" category={category}
      choicesLoader={() => Promise.resolve({ choices: [choice] })} creator={creator}
      onSaved={vi.fn()} onClose={onClose} />)
    const close = screen.getByRole('button', { name: 'Close add entry' })
    const createAccount = screen.getByRole('button', { name: 'Create new account' })
    createAccount.focus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(await screen.findByRole('option', { name: /Peyton Person/ })).toHaveFocus()
    await user.click(screen.getByRole('option', { name: /Peyton Person/ }))
    await user.type(screen.getByLabelText('Entry title'), 'Pending entry')
    const save = screen.getByRole('button', { name: 'Save entry' })
    save.focus()
    await user.keyboard('{Tab}')
    expect(close).toHaveFocus()
    await user.click(save)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await user.click(close)
    expect(onClose).not.toHaveBeenCalled()
    resolveCreate({})
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
