import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventSearchResults from '../../src/features/search/EventSearchResults.jsx'

describe('event search results', () => {
  it('renders private minimization and keyboard load-more fallback', () => {
    const loadMore = vi.fn()
    render(<EventSearchResults nodes={[{ publicId: 'p', title: 'Private', description: 'Description',
      location: null, visibility: 'PRIVATE' }]} status="results" nextCursor="next"
      onLoadMore={loadMore} onSelect={vi.fn()} onRetry={vi.fn()} />)
    expect(screen.getByText('Private event')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load more events' }))
    expect(loadMore).toHaveBeenCalledOnce()
  })

  it('observes the sentinel and supports loading and retry states', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    globalThis.IntersectionObserver = class {
      constructor(callback) { this.callback = callback }
      observe() { observe(); this.callback([{ isIntersecting: true }]) }
      disconnect() { disconnect() }
    }
    const loadMore = vi.fn()
    const { rerender, unmount } = render(<EventSearchResults nodes={[]} status="loading-more"
      nextCursor="next" onLoadMore={loadMore} onSelect={vi.fn()} onRetry={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading more')
    expect(loadMore).toHaveBeenCalled()
    rerender(<EventSearchResults nodes={[]} status="more-error" nextCursor="next"
      onLoadMore={loadMore} onSelect={vi.fn()} onRetry={loadMore} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(loadMore).toHaveBeenCalledTimes(2)
    unmount()
    expect(disconnect).toHaveBeenCalled()
    delete globalThis.IntersectionObserver
  })
})
