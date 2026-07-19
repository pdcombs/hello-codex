import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AddEntryOwnerStep from '../../src/features/events/AddEntryOwnerStep.jsx'

describe('recent entry owner choices', () => {
  it('renders newest choices once with contact and selects directly', async () => {
    const onSelect = vi.fn()
    render(<AddEntryOwnerStep eventId="event-1" onSelect={onSelect} loader={() => Promise.resolve({ choices: [
      { accountId: 'new', displayName: 'Newest', email: 'new@example.test', phone: '+15551234567' },
      { accountId: 'old', displayName: 'Older', email: null, phone: null },
    ] })} />)
    const choices = await screen.findAllByRole('option')
    expect(choices[0]).toHaveTextContent('Newest')
    expect(choices[0]).toHaveTextContent('new@example.test · +15551234567')
    expect(choices[1]).toHaveTextContent('Contact unavailable')
    await userEvent.setup().click(choices[0])
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ account: expect.objectContaining({ accountId: 'new' }) }))
  })

  it('renders empty state and retries a failed recent load', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('Choices unavailable.'))
      .mockResolvedValueOnce({ choices: [] })
    const user = userEvent.setup()
    render(<AddEntryOwnerStep eventId="event-1" onSelect={vi.fn()} loader={loader} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Choices unavailable.')
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('No recent participants yet.')).toBeVisible()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
