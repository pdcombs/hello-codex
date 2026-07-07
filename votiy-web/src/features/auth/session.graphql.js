import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

const SESSION = 'session { account { id email isVerified createdAt } }'
const ERROR = 'code message correlationId fieldErrors { field code message }'
export const SIGN_IN = `mutation SignIn($input: SignInInput!) { signIn(input: $input) { __typename ... on SessionSuccess { ${SESSION} } ... on OperationError { ${ERROR} } } }`
export const SIGN_OUT = `mutation SignOut { signOut { __typename ... on SignOutSuccess { signedOut } ... on OperationError { ${ERROR} } } }`
export async function signInAccount(input) {
  const data = await graphqlRequest({ query: SIGN_IN, variables: { input }, operationName: 'SignIn' })
  return unwrapGraphqlResult(data.signIn)
}
export async function signOutAccount() {
  const data = await graphqlRequest({ query: SIGN_OUT, operationName: 'SignOut' })
  return unwrapGraphqlResult(data.signOut)
}
