export const VOTING_RULES_STATUS = Object.freeze({ DRAFT: 'DRAFT', CONFIGURED: 'CONFIGURED' })
export const VOTING_ACCESS_POLICY = Object.freeze({
  UNRESTRICTED: 'UNRESTRICTED', ACCOUNT: 'ACCOUNT', CODE: 'CODE',
})
export const CATEGORY_VOTING_METHOD = Object.freeze({
  SINGLE: 'SINGLE', MULTIPLE: 'MULTIPLE', RANKING: 'RANKING',
})

export const EVENT_VOTING_CAPABILITY_QUERY = `
  query EventVotingCapability($eventId: ID!) {
    eventVotingCapability(eventId: $eventId) {
      ... on EventVotingCapabilitySuccess {
        capability {
          votingStatus canVote reasonCode remainingBallots hasEventAccess
          rules {
            status version opensAt closesAt accessPolicy unrestrictedRepeatPolicy
            maximumBallotsPerAccount codeRequiresCompletedAccount updatedAt
            defaultCategoryRule { categoryId method minimumSelections maximumSelections }
            categoryRules { categoryId method minimumSelections maximumSelections }
          }
        }
      }
      ... on OperationError { code message fieldErrors { field message } }
    }
  }
`

const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'
export const UPDATE_EVENT_VOTING_RULES = `
  mutation UpdateEventVotingRules($input: UpdateEventVotingRulesInput!) {
    updateEventVotingRules(input: $input) {
      __typename
      ... on EventSuccess { event { id updatedAt voting { votingStatus canVote reasonCode rules {
        status version opensAt closesAt accessPolicy unrestrictedRepeatPolicy maximumBallotsPerAccount
        codeRequiresCompletedAccount updatedAt defaultCategoryRule { method minimumSelections maximumSelections }
        categoryRules { categoryId method minimumSelections maximumSelections }
      } } } }
      ... on OperationError { ${ERROR_FIELDS} }
    }
  }
`

export const SUBMIT_EVENT_BALLOT = `
  mutation SubmitEventBallot($input: SubmitEventBallotInput!) {
    submitEventBallot(input: $input) {
      __typename
      ... on BallotSubmissionSuccess { receipt { id eventId rulesVersion submittedAt } }
      ... on OperationError { ${ERROR_FIELDS} }
    }
  }
`

export const GENERATE_VOTING_CODES = `mutation GenerateVotingCodes($input: GenerateVotingCodesInput!) {
  generateVotingCodes(input: $input) { __typename
    ... on VotingCodeGenerationSuccess { codes { id code status claimantAccountId claimantDisplayName claimantEmail createdAt usedAt } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
export const EVENT_VOTING_CODES = `query EventVotingCodes($eventId: ID!, $first: Int, $after: String) {
  eventVotingCodes(eventId: $eventId, first: $first, after: $after) { __typename
    ... on VotingCodeListSuccess { codes { nodes { id code status claimantAccountId claimantDisplayName claimantEmail createdAt usedAt } nextCursor } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

export async function updateEventVotingRules(input) {
  const data = await graphqlRequest({ query: UPDATE_EVENT_VOTING_RULES, variables: { input },
    operationName: 'UpdateEventVotingRules' })
  return unwrapGraphqlResult(data.updateEventVotingRules)
}

export async function submitEventBallot(input) {
  const data = await graphqlRequest({ query: SUBMIT_EVENT_BALLOT, variables: { input },
    operationName: 'SubmitEventBallot' })
  return unwrapGraphqlResult(data.submitEventBallot)
}

export async function loadEventVotingCapability(eventId) {
  const data = await graphqlRequest({ query: EVENT_VOTING_CAPABILITY_QUERY, variables: { eventId },
    operationName: 'EventVotingCapability' })
  return unwrapGraphqlResult(data.eventVotingCapability).capability
}

export async function generateVotingCodes(input) {
  const data = await graphqlRequest({ query: GENERATE_VOTING_CODES, variables: { input }, operationName: 'GenerateVotingCodes' })
  return unwrapGraphqlResult(data.generateVotingCodes)
}

export async function loadVotingCodes(eventId, first = 50, after = null) {
  const data = await graphqlRequest({ query: EVENT_VOTING_CODES, variables: { eventId, first, after },
    operationName: 'EventVotingCodes' })
  return unwrapGraphqlResult(data.eventVotingCodes).codes
}
