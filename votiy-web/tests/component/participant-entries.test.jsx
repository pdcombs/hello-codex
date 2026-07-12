import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ParticipantEntryFields from '../../src/features/events/ParticipantEntryFields.jsx'
import { readEntries } from '../../src/features/events/participant-entry-form.js'

describe('participant entry fields', () => {
  it('defaults category, adds rows, and reads complete entry input', async () => {
    const categories = [{ id: 'cat-1', title: 'Desserts', isDefault: true }]
    const { rerender } = render(<form data-testid="form"><ParticipantEntryFields categories={categories} count={1} /></form>)
    expect(screen.getByLabelText('Entry 1 category')).toHaveValue('cat-1')
    rerender(<form data-testid="form"><ParticipantEntryFields categories={categories} count={2} /></form>)
    await userEvent.setup().clear(screen.getByLabelText('Entry 1 title'))
    await userEvent.setup().type(screen.getByLabelText('Entry 1 title'), 'Pie')
    expect(readEntries(new FormData(screen.getByTestId('form')), 2)).toEqual([
      { title: 'Pie', categoryId: 'cat-1' }, { title: 'Entry 2', categoryId: 'cat-1' },
    ])
  })
})
