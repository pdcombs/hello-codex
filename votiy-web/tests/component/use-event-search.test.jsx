import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useEventSearch from '../../src/features/search/useEventSearch.js'

describe('useEventSearch', () => {
  afterEach(() => vi.useRealTimers())

  it('debounces, loads, appends, retries, and resets', async () => {
    vi.useFakeTimers()
    const search = vi.fn()
      .mockResolvedValueOnce({ events: { nodes: [{ publicId: '1' }], nextCursor: 'next' } })
      .mockResolvedValueOnce({ events: { nodes: [{ publicId: '2' }], nextCursor: null } })
    const { result } = renderHook(() => useEventSearch({ search, debounceMs: 10 }))
    act(() => result.current.open())
    act(() => result.current.setQuery('show'))
    await act(async () => { await vi.advanceTimersByTimeAsync(10); await Promise.resolve() })
    expect(result.current.state.nodes).toHaveLength(1)
    await act(async () => result.current.loadMore())
    expect(result.current.state.nodes).toHaveLength(2)
    act(() => result.current.close())
    expect(result.current.state.status).toBe('closed')
  })

  it('maps first-page and later-page failures', async () => {
    vi.useFakeTimers()
    const search = vi.fn().mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ events: { nodes: [{ publicId: '1' }], nextCursor: 'next' } })
      .mockRejectedValueOnce(new Error('later offline'))
    const { result } = renderHook(() => useEventSearch({ search, debounceMs: 1 }))
    act(() => result.current.open())
    act(() => result.current.setQuery('show'))
    await act(async () => { await vi.advanceTimersByTimeAsync(1); await Promise.resolve() })
    expect(result.current.state.status).toBe('error')
    act(() => result.current.retry())
    await act(async () => { await vi.advanceTimersByTimeAsync(1); await Promise.resolve() })
    expect(result.current.state.status).toBe('results')
    await act(async () => result.current.loadMore())
    expect(result.current.state.status).toBe('more-error')
  })
})
