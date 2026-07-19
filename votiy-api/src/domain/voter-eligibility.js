import { ApplicationError, ErrorCode } from './errors.js'

export function accountIsVotingComplete(account) {
  return Boolean(account?.emailNormalized && account?.phoneNormalized)
}

export function assertAccountEligibility({ rules, account, ballotCount = 0 }) {
  if (!account) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
  if (!accountIsVotingComplete(account)) throw new ApplicationError(ErrorCode.ACCOUNT_REQUIREMENTS_NOT_MET)
  if (ballotCount >= rules.maxBallotsPerAccount) throw new ApplicationError(ErrorCode.BALLOT_LIMIT_REACHED)
  return { remainingBallots: rules.maxBallotsPerAccount - ballotCount }
}

export function browserMarkerRequired(rules) {
  return rules.accessPolicy === 'unrestricted' && rules.unrestrictedRepeatPolicy === 'browser_limited'
}

export function codeAccountRequired(rules) {
  return rules.accessPolicy === 'code' && rules.codeRequiresCompletedAccount
}

export function provisionalContact(input) {
  const email = input?.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApplicationError(ErrorCode.ACCOUNT_REQUIREMENTS_NOT_MET)
  }
  return { emailNormalized: email, phoneNormalized: input.phone?.trim() || null,
    displayName: email.split('@')[0].slice(0, 100) }
}
