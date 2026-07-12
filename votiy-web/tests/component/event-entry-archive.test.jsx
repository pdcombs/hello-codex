import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventEntryRow from '../../src/features/events/EventEntryRow.jsx'

describe('entry archive control', () => {
  it('is owner-only and requires confirmation', async () => {
    const entry = { id: 'entry-1', title: 'Pie', ownerDisplayName: 'Peyton' }
    const { rerender } = render(<ul><EventEntryRow entry={entry} /></ul>)
    expect(screen.queryByRole('button', { name: 'Remove entry' })).not.toBeInTheDocument()
    const onRemove = vi.fn()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    rerender(<ul><EventEntryRow entry={entry} onRemove={onRemove} /></ul>)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove entry' }))
    expect(onRemove).toHaveBeenCalledWith(entry)
    vi.unstubAllGlobals()
  })

  it('leaves the entry unchanged when confirmation is declined', async () => {
    const entry = { id: 'entry-1', title: 'Pie', ownerDisplayName: 'Peyton' }
    const onRemove = vi.fn()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    render(<ul><EventEntryRow entry={entry} onRemove={onRemove} /></ul>)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove entry' }))
    expect(onRemove).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
