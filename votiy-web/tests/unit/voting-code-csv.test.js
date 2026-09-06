import { describe, expect, it } from 'vitest'
import { votingCodesCsv, votingCodesFilename } from '../../src/features/voting/voting-code-csv.js'

describe('voting code CSV', () => {
  it('creates Excel-compatible formula-safe quoted rows', () => {
    const csv = votingCodesCsv([{ code: 'abc123', status: 'USED', usedAt: '2030-01-01T00:00:00.000Z',
      claimantDisplayName: '=HYPERLINK("bad")', claimantEmail: 'a,b@example.test' }])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"')
    expect(csv).toContain('"a,b@example.test"')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('sanitizes event title in dated filename', () => {
    expect(votingCodesFilename('Fall Awards!', new Date('2030-02-03T12:00:00Z')))
      .toBe('fall-awards-voting-codes-2030-02-03.csv')
  })
})
