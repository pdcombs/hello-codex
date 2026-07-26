import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EventSearchButton from '../../src/features/search/EventSearchButton.jsx'
import EventSearchDialog from '../../src/features/search/EventSearchDialog.jsx'

describe('event search dialog', () => {
  it('provides accessible trigger, field, result selection, and dismissal', () => {
    const controller = {
      state: { status: 'complete', query: 'show', nodes: [{ publicId: 'event 1', title: 'Show',
        description: 'Description', location: 'Rogers', visibility: 'PUBLIC' }], nextCursor: null },
      close: vi.fn(), setQuery: vi.fn(), retry: vi.fn(), loadMore: vi.fn(),
    }
    const triggerRef = { current: { focus: vi.fn() } }
    render(<MemoryRouter><EventSearchButton onClick={vi.fn()} /><EventSearchDialog controller={controller}
      triggerRef={triggerRef} /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Find events' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'motor' } })
    expect(controller.setQuery).toHaveBeenCalledWith('motor')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(controller.close).toHaveBeenCalled()
  })

  it('closes on backdrop, traps focus, selects results, and renders status actions', () => {
    function Location() { return <output data-testid="location">{useLocation().pathname}</output> }
    const controller = {
      state: { status: 'error', query: 'show', nodes: [{ publicId: 'event 1', title: 'Show',
        description: null, location: null, visibility: 'PRIVATE' }], nextCursor: null },
      close: vi.fn(), setQuery: vi.fn(), retry: vi.fn(), loadMore: vi.fn(),
    }
    const triggerRef = { current: { focus: vi.fn() } }
    const { container, rerender } = render(<MemoryRouter><EventSearchDialog controller={controller}
      triggerRef={triggerRef} /><Location /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(controller.retry).toHaveBeenCalled()
    fireEvent.mouseDown(container.querySelector('.event-search-overlay'))
    expect(controller.close).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Show/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/events/event%201')
    const input = screen.getByRole('searchbox')
    input.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    const close = screen.getByRole('button', { name: 'Close' })
    close.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    rerender(<MemoryRouter><EventSearchDialog controller={{ ...controller,
      state: { ...controller.state, status: 'loading', nodes: [] } }} triggerRef={triggerRef} /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent('Searching')
  })
})
