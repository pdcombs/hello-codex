import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddEntryOwnerStep from '../../src/features/events/AddEntryOwnerStep.jsx'

describe('entry owner typeahead', () => {
  it('waits for three characters and renders current matches', async () => {
    const loader = vi.fn(async (_eventId, search) => ({ choices: search ? [
      { accountId: 'match', displayName: 'Matching Person', email: 'peyton@example.test' },
    ] : [] }))
    const user = userEvent.setup()
    render(<AddEntryOwnerStep eventId="event-1" loader={loader} onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search by email or phone')
    await user.type(input, 'pe')
    expect(screen.getByText('Enter at least 3 characters.')).toBeVisible()
    await user.type(input, 'y')
    expect(await screen.findByRole('option', { name: /Matching Person/ })).toBeVisible()
    expect(loader).toHaveBeenLastCalledWith('event-1', 'pey', 10)
  })

  it('ignores stale responses after search changes', async () => {
    const resolvers = new Map()
    const loader = vi.fn((_eventId, search) => new Promise((resolve) => resolvers.set(search, resolve)))
    const user = userEvent.setup()
    render(<AddEntryOwnerStep eventId="event-1" loader={loader} onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search by email or phone')
    await user.type(input, 'pey')
    await vi.waitFor(() => expect(resolvers.has('pey')).toBe(true))
    await user.clear(input)
    await user.type(input, 'pat')
    await vi.waitFor(() => expect(resolvers.has('pat')).toBe(true))
    resolvers.get('pat')({ choices: [{ accountId: 'current', displayName: 'Current Person' }] })
    expect(await screen.findByRole('option', { name: /Current Person/ })).toBeVisible()
    resolvers.get('pey')({ choices: [{ accountId: 'stale', displayName: 'Stale Person' }] })
    expect(screen.queryByRole('option', { name: /Stale Person/ })).not.toBeInTheDocument()
  })
})
