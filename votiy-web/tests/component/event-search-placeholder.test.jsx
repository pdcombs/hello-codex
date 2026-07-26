import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useSearchPlaceholder, { SEARCH_EXAMPLES } from '../../src/features/search/useSearchPlaceholder.js'

describe('search examples', () => {
  afterEach(() => vi.useRealTimers())
  it('cycles every 2.5 seconds and cleans up', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useSearchPlaceholder(true))
    expect(result.current).toBe(SEARCH_EXAMPLES[0])
    act(() => vi.advanceTimersByTime(2500))
    expect(result.current).toBe(SEARCH_EXAMPLES[1])
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stays on the first example when inactive or reduced motion is requested', () => {
    globalThis.matchMedia = vi.fn(() => ({ matches: true }))
    const inactive = renderHook(() => useSearchPlaceholder(false))
    expect(inactive.result.current).toBe(SEARCH_EXAMPLES[0])
    inactive.unmount()
    const reduced = renderHook(() => useSearchPlaceholder(true))
    expect(reduced.result.current).toBe(SEARCH_EXAMPLES[0])
    reduced.unmount()
    delete globalThis.matchMedia
  })
})
