import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

const ACCOUNT_FIELDS = 'id email isVerified createdAt'
const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'

export const REGISTER_ACCOUNT = `mutation Register($input: RegisterInput!) {
  register(input: $input) { __typename ... on AccountSuccess { account { ${ACCOUNT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const VERIFY_EMAIL = `mutation VerifyEmail($input: VerifyEmailInput!) {
  verifyEmail(input: $input) { __typename ... on SessionSuccess { session { account { ${ACCOUNT_FIELDS} } } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const RESEND_VERIFICATION = `mutation ResendVerification {
  resendVerification { __typename ... on AccountSuccess { account { ${ACCOUNT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const VIEWER = `query Viewer {
  viewer { __typename ... on SessionSuccess { session { account { ${ACCOUNT_FIELDS} } } } ... on OperationError { ${ERROR_FIELDS} } }
}`

export async function registerAccount(input) {
  const data = await graphqlRequest({ query: REGISTER_ACCOUNT, variables: { input }, operationName: 'Register' })
  return unwrapGraphqlResult(data.register)
}
export async function verifyAccountEmail(input) {
  const data = await graphqlRequest({ query: VERIFY_EMAIL, variables: { input }, operationName: 'VerifyEmail' })
  return unwrapGraphqlResult(data.verifyEmail)
}
export async function resendAccountVerification() {
  const data = await graphqlRequest({ query: RESEND_VERIFICATION, operationName: 'ResendVerification' })
  return unwrapGraphqlResult(data.resendVerification)
}
export async function loadViewer() {
  const data = await graphqlRequest({ query: VIEWER, operationName: 'Viewer' })
  return unwrapGraphqlResult(data.viewer)
}
