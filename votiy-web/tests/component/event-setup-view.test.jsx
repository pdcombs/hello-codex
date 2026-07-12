import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EventCategoryList from '../../src/features/events/EventCategoryList.jsx'
import EventSetupTabs from '../../src/features/events/EventSetupTabs.jsx'
import { readEntries } from '../../src/features/events/participant-entry-form.js'

const categories = [
  { id: 'cat-1', title: 'Desserts', entries: [{ id: 'entry-1', title: 'Apple Pie', ownerDisplayName: 'Peyton' }] },
  { id: 'cat-2', title: 'Drinks', entries: [] },
]

describe('grouped event setup view', () => {
  it('renders grouped entry ownership, empty categories, and no contact data', () => {
    render(<EventCategoryList categories={categories} />)
    expect(screen.getByRole('heading', { name: 'Desserts' })).toBeVisible()
    expect(screen.getByText('Apple Pie')).toBeVisible()
    expect(screen.getByText('Owned by Peyton')).toBeVisible()
    expect(screen.getByText('No entries in this category.')).toBeVisible()
    expect(document.body.textContent).not.toMatch(/@|\+1555/)
  })

  it('handles omitted category and entry form data safely', () => {
    const { unmount } = render(<EventCategoryList />)
    expect(screen.getByText('No categories available.')).toBeVisible()
    unmount()
    expect(readEntries(new FormData(), 1)).toEqual([{ title: '', categoryId: '' }])
  })

  it('provides accessible responsive setup and participant tabs', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<EventSetupTabs activeTab="setup" onChange={onChange}
      setup={<EventCategoryList categories={categories} />} participants={<p>Participant summary</p>} />)
    expect(screen.getByRole('tab', { name: 'Setup' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Participants' }))
    expect(onChange).toHaveBeenCalledWith('participants')
    rerender(<EventSetupTabs activeTab="participants" onChange={onChange}
      setup={<EventCategoryList categories={categories} />} participants={<p>Participant summary</p>} />)
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Participants')
    expect(screen.getByText('Participant summary')).toBeVisible()
  })
})
