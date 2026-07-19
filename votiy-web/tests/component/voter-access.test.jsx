import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EventBallot from '../../src/features/voting/EventBallot.jsx'

const event = { id: 'event-1', categories: [{ id: 'category-1', title: 'Finalists',
  entries: [{ id: 'entry-1', title: 'One' }] }], voting: { votingStatus: 'OPEN', canVote: true,
  remainingBallots: null, hasEventAccess: false, rules: { version: 1, accessPolicy: 'CODE',
    codeRequiresCompletedAccount: false, unrestrictedRepeatPolicy: null,
    defaultCategoryRule: { method: 'SINGLE' }, categoryRules: [] } } }

describe('voter access UI', () => {
  it('collects code, email, and optional phone for provisional code voter', () => {
    render(<EventBallot event={event} />)
    expect(screen.getByLabelText('Voting code')).toBeRequired()
    expect(screen.getByLabelText('Email')).toBeRequired()
    expect(screen.getByLabelText(/Phone/)).not.toBeRequired()
  })
  it('renders account requirement and ballot limit reasons', () => {
    render(<EventBallot event={{ ...event, voting: { ...event.voting, canVote: false,
      reasonCode: 'ACCOUNT_REQUIREMENTS_NOT_MET' } }} />)
    expect(screen.getByText('Add both email and phone to your account before voting.')).toBeVisible()
  })
  it('discloses weak browser limit and remaining account ballots', () => {
    render(<EventBallot event={{ ...event, voting: { ...event.voting, remainingBallots: 2, rules: {
      ...event.voting.rules, accessPolicy: 'UNRESTRICTED', unrestrictedRepeatPolicy: 'BROWSER_LIMITED' } } }} />)
    expect(screen.getByText(/Clearing browser data may reset/)).toBeVisible()
    expect(screen.getByText('2 ballots remaining.')).toBeVisible()
  })
})
