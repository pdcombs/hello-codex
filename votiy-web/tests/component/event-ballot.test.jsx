import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventBallot from '../../src/features/voting/EventBallot.jsx'

function eventFixture(overrides = {}) {
  return { id: 'event-1', categories: [
    { id: 'single', title: 'Single', entries: [{ id: 's1', title: 'One' }, { id: 's2', title: 'Two' }] },
    { id: 'multiple', title: 'Multiple', entries: [{ id: 'm1', title: 'Three' }, { id: 'm2', title: 'Four' }] },
    { id: 'ranking', title: 'Ranking', entries: [{ id: 'r1', title: 'Five' }, { id: 'r2', title: 'Six' }] },
  ], voting: { votingStatus: 'OPEN', canVote: true, rules: { version: 2,
    defaultCategoryRule: { method: 'SINGLE', minimumSelections: null, maximumSelections: null },
    categoryRules: [
      { categoryId: 'multiple', method: 'MULTIPLE', minimumSelections: 1, maximumSelections: 2 },
      { categoryId: 'ranking', method: 'RANKING', minimumSelections: null, maximumSelections: null },
    ] } }, ...overrides }
}

describe('EventBallot', () => {
  it('renders server-selected single, multiple, and ranking controls and submits selections', async () => {
    const submitter = vi.fn().mockResolvedValue({ receipt: { id: 'ballot-1' } })
    render(<EventBallot event={eventFixture()} submitter={submitter} />)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
    await userEvent.click(screen.getByLabelText('One'))
    await userEvent.click(screen.getByLabelText('Three'))
    await userEvent.selectOptions(screen.getByLabelText('Ranking rank 1'), 'r1')
    await userEvent.selectOptions(screen.getByLabelText('Ranking rank 2'), 'r2')
    await userEvent.click(screen.getByRole('button', { name: 'Submit ballot' }))
    expect(submitter).toHaveBeenCalledWith(expect.objectContaining({ expectedRulesVersion: 2 }))
    expect(await screen.findByText('Your ballot was submitted.')).toBeVisible()
  })

  it.each([['UPCOMING', 'Voting has not opened yet.'], ['CLOSED', 'Voting has closed.'],
    ['NOT_CONFIGURED', 'Voting has not been configured.']])('renders %s capability', (status, message) => {
    const event = eventFixture(); event.voting = { ...event.voting, votingStatus: status, canVote: false }
    render(<EventBallot event={event} />)
    expect(screen.getByText(message)).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Submit ballot' })).not.toBeInTheDocument()
  })
})
