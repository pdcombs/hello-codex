import { graphqlRequest, unwrapGraphqlResult } from '../../lib/graphql.js'

const EVENT_FIELDS = 'id publicId title description location registrationPolicy isOwner createdAt updatedAt'
const REGISTRATION_FIELDS = 'id accountId email phone accountCompleted status source createdAt'
const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'

export const OWNED_EVENTS = `query OwnedEvents($first: Int, $after: String) {
  ownedEvents(first: $first, after: $after) {
    __typename
    ... on EventListSuccess { events { nodes { ${EVENT_FIELDS} } nextCursor } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const EVENT_BY_PUBLIC_ID = `query EventByPublicId($publicId: String!) {
  eventByPublicId(publicId: $publicId) {
    __typename
    ... on EventSuccess { event { ${EVENT_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const EVENT_REGISTRATIONS = `query EventRegistrations($eventId: ID!) {
  eventRegistrations(eventId: $eventId) {
    __typename
    ... on EventRegistrationListSuccess { registrations { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const CREATE_EVENT = `mutation CreateEvent($input: CreateEventInput!) {
  createEvent(input: $input) {
    __typename
    ... on EventSuccess { event { ${EVENT_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const SET_EVENT_REGISTRATION_POLICY = `mutation SetEventRegistrationPolicy($input: SetEventRegistrationPolicyInput!) {
  setEventRegistrationPolicy(input: $input) {
    __typename
    ... on EventSuccess { event { ${EVENT_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const REGISTER_FOR_EVENT = `mutation RegisterForEvent($eventId: ID!, $idempotencyKey: ID!) {
  registerForEvent(eventId: $eventId, idempotencyKey: $idempotencyKey) {
    __typename
    ... on EventRegistrationSuccess { registration { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const ADD_EVENT_PARTICIPANT = `mutation AddEventParticipant($input: AddEventParticipantInput!) {
  addEventParticipant(input: $input) {
    __typename
    ... on EventRegistrationSuccess { registration { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export const REMOVE_EVENT_PARTICIPANT = `mutation RemoveEventParticipant($input: RemoveEventParticipantInput!) {
  removeEventParticipant(input: $input) {
    __typename
    ... on EventRegistrationSuccess { registration { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`

export async function loadOwnedEvents(variables = { first: 20 }) {
  const data = await graphqlRequest({ query: OWNED_EVENTS, variables, operationName: 'OwnedEvents' })
  return unwrapGraphqlResult(data.ownedEvents)
}

export async function loadEventByPublicId(publicId) {
  const data = await graphqlRequest({
    query: EVENT_BY_PUBLIC_ID,
    variables: { publicId },
    operationName: 'EventByPublicId',
  })
  return unwrapGraphqlResult(data.eventByPublicId)
}

export async function loadEventRegistrations(eventId) {
  const data = await graphqlRequest({
    query: EVENT_REGISTRATIONS,
    variables: { eventId },
    operationName: 'EventRegistrations',
  })
  return unwrapGraphqlResult(data.eventRegistrations)
}

export async function createEvent(input) {
  const data = await graphqlRequest({ query: CREATE_EVENT, variables: { input }, operationName: 'CreateEvent' })
  return unwrapGraphqlResult(data.createEvent)
}

export async function setEventRegistrationPolicy(input) {
  const data = await graphqlRequest({
    query: SET_EVENT_REGISTRATION_POLICY,
    variables: { input },
    operationName: 'SetEventRegistrationPolicy',
  })
  return unwrapGraphqlResult(data.setEventRegistrationPolicy)
}

export async function registerForEvent(input) {
  const data = await graphqlRequest({
    query: REGISTER_FOR_EVENT,
    variables: input,
    operationName: 'RegisterForEvent',
  })
  return unwrapGraphqlResult(data.registerForEvent)
}

export async function addEventParticipant(input) {
  const data = await graphqlRequest({
    query: ADD_EVENT_PARTICIPANT,
    variables: { input },
    operationName: 'AddEventParticipant',
  })
  return unwrapGraphqlResult(data.addEventParticipant)
}

export async function removeEventParticipant(input) {
  const data = await graphqlRequest({
    query: REMOVE_EVENT_PARTICIPANT,
    variables: { input },
    operationName: 'RemoveEventParticipant',
  })
  return unwrapGraphqlResult(data.removeEventParticipant)
}
