import { useEffect, useState } from 'react'

export const SEARCH_EXAMPLES = Object.freeze([
  'motorcycle show in rogers ar',
  'bbq competition in kansas city',
  'talent show in bentonville',
])

export default function useSearchPlaceholder(active, { intervalMs = 2500 } = {}) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    setIndex(0)
    if (!active || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(() => setIndex((value) => (value + 1) % SEARCH_EXAMPLES.length), intervalMs)
    return () => clearInterval(timer)
  }, [active, intervalMs])
  return SEARCH_EXAMPLES[index]
}
