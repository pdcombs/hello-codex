import { describe, expect, it } from 'vitest'
import { hasMutationHeaders, isAllowedMutationOrigin } from '../../src/api/request-security.js'

describe('request mutation security', () => {
  it('allows exact production origin and compatible local loopback hosts only', () => {
    expect(isAllowedMutationOrigin('https://votiy.test', 'https://votiy.test', true)).toBe(true)
    expect(isAllowedMutationOrigin('http://localhost:5173', 'http://127.0.0.1:5173', false)).toBe(true)
    expect(isAllowedMutationOrigin('http://localhost:5174', 'http://127.0.0.1:5173', false)).toBe(false)
    expect(isAllowedMutationOrigin('not-a-url', 'http://127.0.0.1:5173', false)).toBe(false)
    expect(isAllowedMutationOrigin('http://localhost:5173', 'http://127.0.0.1:5173', true)).toBe(false)
  })

  it('requires the application request marker', () => {
    expect(hasMutationHeaders({ headers: { origin: 'https://votiy.test', 'x-requested-with': 'votiy-web' } },
      'https://votiy.test', true)).toBe(true)
    expect(hasMutationHeaders({ headers: { origin: 'https://votiy.test' } }, 'https://votiy.test', true)).toBe(false)
  })
})
