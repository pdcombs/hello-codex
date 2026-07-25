import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EventWorkspaceTabs from '../../src/features/events/EventWorkspaceTabs.jsx'

describe('event workspace tabs', () => {
  it('derives selection from URL and navigates with links', async () => {
    render(<MemoryRouter initialEntries={['/events/demo/participants']}><Routes>
      <Route path="/events/:publicId/*" element={<EventWorkspaceTabs publicId="demo" />} />
    </Routes></MemoryRouter>)
    expect(screen.getByRole('tab', { name: 'Participants' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Results (coming soon)' }))
    expect(screen.getByRole('tab', { name: 'Results (coming soon)' })).toHaveAttribute('aria-selected', 'true')
  })
})
