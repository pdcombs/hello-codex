import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivateEventNotice from '../../src/features/search/PrivateEventNotice.jsx'

describe('private event view', () => {
  it('explains protected content without rendering it', () => {
    render(<PrivateEventNotice />)
    expect(screen.getByRole('note')).toHaveTextContent('private event')
    expect(screen.getByRole('note')).toHaveTextContent('not visible')
  })
})
