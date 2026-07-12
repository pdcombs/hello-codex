import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventParticipantCardList from '../../src/features/events/EventParticipantCardList.jsx'

const participant = {
  accountId: 'account-1', displayName: 'Peyton', email: 'peyton@example.test', entryCount: 3,
  entries: [{ id: '1', title: 'Pie' }, { id: '2', title: 'Pie' }, { id: '3', title: 'Cake' }],
}

describe('participant cards', () => {
  it('shows name, email, every entry title, and a numeric count', () => {
    render(<EventParticipantCardList participants={[participant]} />)
    expect(screen.getByRole('heading', { name: 'Peyton' })).toBeVisible()
    expect(screen.getByText('peyton@example.test')).toBeVisible()
    expect(screen.getAllByText('Pie')).toHaveLength(2)
    expect(screen.getByLabelText('3 entries')).toHaveTextContent('3')
    expect(screen.queryByRole('button', { name: 'Remove participant' })).not.toBeInTheDocument()
  })

  it('confirms owner removal with the affected entry count', async () => {
    const onRemove = vi.fn()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    render(<EventParticipantCardList participants={[participant]} onRemove={onRemove} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove participant' }))
    expect(globalThis.confirm).toHaveBeenCalledWith(expect.stringContaining('all 3 entries'))
    expect(onRemove).toHaveBeenCalledWith(participant)
    vi.unstubAllGlobals()
  })

  it('shows an unavailable email and cancels removal safely', async () => {
    const onRemove = vi.fn()
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    const { rerender } = render(<EventParticipantCardList participants={[{ ...participant, email: null }]} onRemove={onRemove} disabled />)
    expect(screen.getByText('Email unavailable')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Remove participant' })).toBeDisabled()
    rerender(<EventParticipantCardList participants={[{ ...participant, email: null }]} onRemove={onRemove} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove participant' }))
    expect(onRemove).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
