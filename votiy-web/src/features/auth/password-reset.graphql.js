import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

const ERROR = 'code message correlationId fieldErrors { field code message }'
export const REQUEST_PASSWORD_RESET = `mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
  requestPasswordReset(input: $input) { __typename ... on PasswordResetRequestSuccess { accepted bypassToken }
    ... on OperationError { ${ERROR} } } }`
export const INSPECT_PASSWORD_RESET = `query InspectPasswordReset($input: InspectPasswordResetInput!) {
  inspectPasswordReset(input: $input) { __typename ... on PasswordResetInspectionSuccess { email expiresAt }
    ... on OperationError { ${ERROR} } } }`
export const RESET_PASSWORD = `mutation ResetPassword($input: ResetPasswordInput!) {
  resetPassword(input: $input) { __typename ... on PasswordResetSuccess { reset }
    ... on OperationError { ${ERROR} } } }`

export async function requestPasswordReset(input) {
  const data = await graphqlRequest({ query: REQUEST_PASSWORD_RESET, variables: { input }, operationName: 'RequestPasswordReset' })
  return unwrapGraphqlResult(data.requestPasswordReset)
}
export async function inspectPasswordReset(input) {
  const data = await graphqlRequest({ query: INSPECT_PASSWORD_RESET, variables: { input }, operationName: 'InspectPasswordReset' })
  return unwrapGraphqlResult(data.inspectPasswordReset)
}
export async function resetPassword(input) {
  const data = await graphqlRequest({ query: RESET_PASSWORD, variables: { input }, operationName: 'ResetPassword' })
  return unwrapGraphqlResult(data.resetPassword)
}
