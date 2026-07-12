import { graphqlRequest, isSchemaMismatch, unwrapGraphqlResult } from '../../lib/graphql.js'

const ENTRY_FIELDS = 'id title categoryId ownerAccountId ownerDisplayName createdAt'
const EVENT_FIELDS = `id publicId title description location registrationPolicy isOwner createdAt updatedAt categories { id title isDefault createdAt updatedAt entries { ${ENTRY_FIELDS} } }`
const REGISTRATION_FIELDS = `id accountId email phone displayName entryCount entries { ${ENTRY_FIELDS} } accountCompleted status source createdAt`
const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'
const LEGACY_EVENT_FIELDS = 'id publicId title description location registrationPolicy isOwner createdAt updatedAt'
const LEGACY_REGISTRATION_FIELDS = 'id accountId email phone accountCompleted status source createdAt'

export const OWNED_EVENTS = `query OwnedEvents($first: Int, $after: String) {
  ownedEvents(first: $first, after: $after) {
    __typename
    ... on EventListSuccess { events { nodes { ${EVENT_FIELDS} } nextCursor } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
const LEGACY_OWNED_EVENTS = `query OwnedEvents($first: Int, $after: String) {
  ownedEvents(first: $first, after: $after) { __typename ... on EventListSuccess { events { nodes { ${LEGACY_EVENT_FIELDS} } nextCursor } } ... on OperationError { ${ERROR_FIELDS} } }
}`

export const EVENT_BY_PUBLIC_ID = `query EventByPublicId($publicId: String!) {
  eventByPublicId(publicId: $publicId) {
    __typename
    ... on EventSuccess { event { ${EVENT_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
const LEGACY_EVENT_BY_PUBLIC_ID = `query EventByPublicId($publicId: String!) {
  eventByPublicId(publicId: $publicId) { __typename ... on EventSuccess { event { ${LEGACY_EVENT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`

export const EVENT_REGISTRATIONS = `query EventRegistrations($eventId: ID!) {
  eventRegistrations(eventId: $eventId) {
    __typename
    ... on EventRegistrationListSuccess { registrations { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
const LEGACY_EVENT_REGISTRATIONS = `query EventRegistrations($eventId: ID!) {
  eventRegistrations(eventId: $eventId) { __typename ... on EventRegistrationListSuccess { registrations { ${LEGACY_REGISTRATION_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
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

export const REGISTER_FOR_EVENT = `mutation RegisterForEvent($input: RegisterForEventInput!) {
  registerForEvent(input: $input) {
    __typename
    ... on EventRegistrationSuccess { registration { ${REGISTRATION_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
const LEGACY_REGISTER_FOR_EVENT = `mutation RegisterForEvent($eventId: ID!, $idempotencyKey: ID!) {
  registerForEvent(eventId: $eventId, idempotencyKey: $idempotencyKey) { __typename ... on EventRegistrationSuccess { registration { ${LEGACY_REGISTRATION_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
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
  try {
    const data = await graphqlRequest({ query: OWNED_EVENTS, variables, operationName: 'OwnedEvents' })
    return unwrapGraphqlResult(data.ownedEvents)
  } catch (error) {
    if (!isSchemaMismatch(error)) throw error
    const data = await graphqlRequest({ query: LEGACY_OWNED_EVENTS, variables, operationName: 'OwnedEvents' })
    return unwrapGraphqlResult(data.ownedEvents)
  }
}

export async function loadEventByPublicId(publicId) {
  try {
    const data = await graphqlRequest({ query: EVENT_BY_PUBLIC_ID, variables: { publicId }, operationName: 'EventByPublicId' })
    return unwrapGraphqlResult(data.eventByPublicId)
  } catch (error) {
    if (!isSchemaMismatch(error)) throw error
    const data = await graphqlRequest({ query: LEGACY_EVENT_BY_PUBLIC_ID, variables: { publicId }, operationName: 'EventByPublicId' })
    return unwrapGraphqlResult(data.eventByPublicId)
  }
}

export async function loadEventRegistrations(eventId) {
  try {
    const data = await graphqlRequest({ query: EVENT_REGISTRATIONS, variables: { eventId }, operationName: 'EventRegistrations' })
    return unwrapGraphqlResult(data.eventRegistrations)
  } catch (error) {
    if (!isSchemaMismatch(error)) throw error
    const data = await graphqlRequest({ query: LEGACY_EVENT_REGISTRATIONS, variables: { eventId }, operationName: 'EventRegistrations' })
    return unwrapGraphqlResult(data.eventRegistrations)
  }
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

export async function registerForEvent(input, { legacy = false } = {}) {
  const data = await graphqlRequest({
    query: legacy ? LEGACY_REGISTER_FOR_EVENT : REGISTER_FOR_EVENT,
    variables: legacy ? { eventId: input.eventId, idempotencyKey: input.idempotencyKey } : { input },
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
