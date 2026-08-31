import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventBallot from '../../src/features/voting/EventBallot.jsx'

function eventFixture(method = 'SINGLE', rule = {}) {
  return { id: 'event-1', publicId: 'public-1', title: 'Awards', votingState: { status: 'OPEN', version: 4 },
    categories: [
      { id: 'one', title: 'First category', entries: [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }] },
      { id: 'two', title: 'Second category', entries: [{ id: 'c', title: 'Gamma' }, { id: 'd', title: 'Delta' }] },
    ], voting: { votingStatus: 'OPEN', rules: { version: 2,
      defaultCategoryRule: { method, minimumSelections: null, maximumSelections: null, ...rule } } } }
}

describe('EventBallot', () => {
  it('blocks empty ballot, confirms submission, then shows exact read-only ballot', async () => {
    const submitter = vi.fn().mockResolvedValue({ ballot: { categoryBallots: [
      { categoryId: 'one', entries: [{ entryId: 'b', entryTitle: 'Beta', selectionOrder: 0 }] },
      { categoryId: 'two', entries: [] },
    ] } })
    render(<EventBallot event={eventFixture()} submitter={submitter} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Submit vote' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one entry')
    await user.click(screen.getByLabelText('Beta'))
    await user.click(screen.getByRole('button', { name: 'Submit vote' }))
    expect(screen.getByRole('alertdialog', { name: 'Submit your vote?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Yes, submit vote' }))
    expect(submitter).toHaveBeenCalledWith(expect.objectContaining({ expectedRulesVersion: 2, expectedVotingStateVersion: 4 }))
    expect(await screen.findByText('Your vote was recorded')).toBeVisible()
    expect(screen.getByLabelText('Beta')).toBeChecked()
    expect(screen.getByLabelText('Beta')).toBeDisabled()
  })

  it('uses multiple choice limits while allowing other categories to remain blank', async () => {
    render(<EventBallot event={eventFixture('MULTIPLE', { minimumSelections: 2, maximumSelections: 2 })} />)
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('Alpha'))
    expect(screen.getByText(/Choose at least 2 entries/)).toBeVisible()
    await user.click(screen.getByLabelText('Beta'))
    expect(screen.getByLabelText('Gamma')).toBeEnabled()
  })

  it('builds complete ranking and supports button movement and clearing', async () => {
    render(<EventBallot event={eventFixture('RANKING')} />)
    const user = userEvent.setup()
    const category = screen.getByRole('group', { name: 'First category' })
    await user.click(within(category).getByRole('button', { name: 'Rank this category' }))
    expect(within(category).getAllByRole('listitem')).toHaveLength(2)
    await user.click(within(category).getByRole('button', { name: 'Move Beta up' }))
    expect(within(category).getAllByRole('listitem')[0]).toHaveTextContent('Beta')
    await user.click(within(category).getByRole('button', { name: 'Clear ranking' }))
    expect(within(category).queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders retrieved ballot and offers another when rules allow', async () => {
    const ballot = { categoryBallots: [{ categoryId: 'one', categoryTitle: 'Original category', method: 'SINGLE',
      entries: [{ entryId: 'a', entryTitle: 'Original entry', selectionOrder: 0 }] },
      { categoryId: 'two', entries: [] }] }
    render(<EventBallot event={eventFixture()} submittedBallot={ballot} mayCastAnother />)
    expect(screen.getByRole('group', { name: 'Original category' })).toBeVisible()
    expect(screen.getByLabelText('Original entry')).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Cast another vote' }))
    expect(screen.getByRole('button', { name: 'Submit vote' })).toBeVisible()
    expect(screen.getByLabelText('Alpha')).not.toBeChecked()
  })
})
