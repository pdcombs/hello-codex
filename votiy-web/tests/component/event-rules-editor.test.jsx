import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventRulesEditor from '../../src/features/voting/EventRulesEditor.jsx'

const event = { id: 'event-1', updatedAt: '2030-01-01T10:00:00Z', categories: [{ id: 'category-1', title: 'Finalists' }],
  voting: { rules: { version: 1, opensAt: '2030-01-01T12:00:00Z', closesAt: '2030-01-01T14:00:00Z',
    accessPolicy: 'UNRESTRICTED', unrestrictedRepeatPolicy: 'UNLIMITED', maximumBallotsPerAccount: null,
    codeRequiresCompletedAccount: null, defaultCategoryRule: { method: 'SINGLE', minimumSelections: null,
      maximumSelections: null }, categoryRules: [] } } }

describe('EventRulesEditor', () => {
  it('renders category controls and saves one complete payload', async () => {
    const saver = vi.fn().mockResolvedValue({ event })
    render(<EventRulesEditor event={event} saver={saver} onSaved={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Finalists' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save voting rules' }))
    expect(saver).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'event-1', expectedRulesVersion: 1 }))
  })

  it('reveals multiple bounds and code policy fields', async () => {
    const saver = vi.fn().mockResolvedValue({ event })
    render(<EventRulesEditor event={event} saver={saver} onSaved={vi.fn()} />)
    const methods = screen.getAllByLabelText('Voting method')
    await userEvent.selectOptions(methods[0], 'MULTIPLE')
    await userEvent.clear(screen.getByLabelText('Minimum selections')); await userEvent.type(screen.getByLabelText('Minimum selections'), '2')
    await userEvent.clear(screen.getByLabelText('Maximum selections')); await userEvent.type(screen.getByLabelText('Maximum selections'), '3')
    await userEvent.selectOptions(screen.getByLabelText('Who can vote'), 'CODE')
    await userEvent.click(screen.getByLabelText('Require completed account'))
    await userEvent.click(screen.getByRole('button', { name: 'Save voting rules' }))
    expect(saver).toHaveBeenCalledWith(expect.objectContaining({ accessPolicy: 'CODE',
      codeRequiresCompletedAccount: false, maximumBallotsPerAccount: null,
      defaultCategoryRule: expect.objectContaining({ method: 'MULTIPLE', minimumSelections: 2, maximumSelections: 3 }) }))
  })
})
