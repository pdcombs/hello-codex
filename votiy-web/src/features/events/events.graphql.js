import { graphqlRequest, isSchemaMismatch, unwrapGraphqlResult } from '../../lib/graphql.js'

const ENTRY_FIELDS = 'id title categoryId ownerAccountId ownerDisplayName status createdAt updatedAt'
const VOTING_FIELDS = `voting { votingStatus canVote reasonCode remainingBallots hasEventAccess rules {
  status version opensAt closesAt accessPolicy unrestrictedRepeatPolicy maximumBallotsPerAccount
  codeRequiresCompletedAccount updatedAt defaultCategoryRule { method minimumSelections maximumSelections }
  categoryRules { categoryId method minimumSelections maximumSelections }
} }`
const EVENT_FIELDS = `id publicId title description location registrationPolicy isOwner createdAt updatedAt categories { id title isDefault createdAt updatedAt entries { ${ENTRY_FIELDS} } } ${VOTING_FIELDS}`
const REGISTRATION_FIELDS = `id accountId email phone displayName entryCount entries { ${ENTRY_FIELDS} } accountCompleted status source createdAt`
const ERROR_FIELDS = 'code message correlationId fieldErrors { field code message }'
const LEGACY_EVENT_FIELDS = 'id publicId title description location registrationPolicy isOwner createdAt updatedAt'
const LEGACY_REGISTRATION_FIELDS = 'id accountId email phone accountCompleted status source createdAt'
const PARTICIPANT_FIELDS = `accountId displayName email entryCount entries { ${ENTRY_FIELDS} }`
const OWNER_CHOICE_FIELDS = 'accountId displayName email phone isEventParticipant latestEntryCreatedAt'

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
export const EVENT_PARTICIPANTS = `query EventParticipants($eventId: ID!) {
  eventParticipants(eventId: $eventId) {
    __typename
    ... on ParticipantListSuccess { participants { ${PARTICIPANT_FIELDS} } }
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

export const REGISTER_FOR_EVENT = `mutation CreateSelfEventEntries($input: RegisterForEventInput!) {
  createSelfEventEntries(input: $input) {
    __typename
    ... on EntryCreationSuccess { result { createdEntries { ${ENTRY_FIELDS} } affectedParticipant { ${PARTICIPANT_FIELDS} } } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
const LEGACY_REGISTER_FOR_EVENT = `mutation RegisterForEvent($eventId: ID!, $idempotencyKey: ID!) {
  registerForEvent(eventId: $eventId, idempotencyKey: $idempotencyKey) { __typename ... on EventRegistrationSuccess { registration { ${LEGACY_REGISTRATION_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`

export const ADD_EVENT_PARTICIPANT = `mutation CreateEventEntriesForParticipant($input: AddEventParticipantInput!) {
  createEventEntriesForParticipant(input: $input) {
    __typename
    ... on EntryCreationSuccess { result { createdEntries { ${ENTRY_FIELDS} } affectedParticipant { ${PARTICIPANT_FIELDS} } } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
export const ARCHIVE_EVENT_ENTRY = `mutation ArchiveEventEntry($input: ArchiveEventEntryInput!) {
  archiveEventEntry(input: $input) {
    __typename
    ... on EntryArchiveSuccess { result { archivedEntryIds affectedParticipant { ${PARTICIPANT_FIELDS} } } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
export const ARCHIVE_EVENT_PARTICIPANT_ENTRIES = `mutation ArchiveEventParticipantEntries($input: ArchiveEventParticipantEntriesInput!) {
  archiveEventParticipantEntries(input: $input) {
    __typename
    ... on EntryArchiveSuccess { result { archivedEntryIds affectedParticipant { ${PARTICIPANT_FIELDS} } } }
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
export const ADD_EVENT_CATEGORY = `mutation AddEventCategory($input: AddEventCategoryInput!) {
  addEventCategory(input: $input) { __typename ... on EventSuccess { event { ${EVENT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const RENAME_EVENT_CATEGORY = `mutation RenameEventCategory($input: RenameEventCategoryInput!) {
  renameEventCategory(input: $input) { __typename ... on EventSuccess { event { ${EVENT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const UPDATE_EVENT_CATEGORY = `mutation UpdateEventCategory($input: UpdateEventCategoryInput!) {
  updateEventCategory(input: $input) { __typename ... on EventSuccess { event { ${EVENT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const ARCHIVE_EVENT_CATEGORY = `mutation ArchiveEventCategory($input: ArchiveEventCategoryInput!) {
  archiveEventCategory(input: $input) { __typename ... on EventSuccess { event { ${EVENT_FIELDS} } } ... on OperationError { ${ERROR_FIELDS} } }
}`
export const ENTRY_OWNER_CHOICES = `query EntryOwnerChoices($eventId: ID!, $search: String, $first: Int) {
  entryOwnerChoices(eventId: $eventId, search: $search, first: $first) {
    __typename
    ... on EntryOwnerChoiceListSuccess { choices { ${OWNER_CHOICE_FIELDS} } }
    ... on OperationError { ${ERROR_FIELDS} }
  }
}`
export const CREATE_EVENT_ENTRY = `mutation CreateEventEntry($input: CreateEventEntryInput!) {
  createEventEntry(input: $input) {
    __typename
    ... on EntryCreationSuccess { result { createdEntries { ${ENTRY_FIELDS} } affectedParticipant { ${PARTICIPANT_FIELDS} } } }
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
    return normalizeEventSetup(unwrapGraphqlResult(data.eventByPublicId))
  } catch (error) {
    if (!isSchemaMismatch(error)) throw error
    const data = await graphqlRequest({ query: LEGACY_EVENT_BY_PUBLIC_ID, variables: { publicId }, operationName: 'EventByPublicId' })
    return unwrapGraphqlResult(data.eventByPublicId)
  }
}

export function normalizeEventSetup(result) {
  if (!Array.isArray(result?.event?.categories)) return result
  return { ...result, event: { ...result.event, categories: result.event.categories.map((category) => ({
    ...category, entries: Array.isArray(category.entries) ? category.entries : [],
  })) } }
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

export async function loadEventParticipants(eventId) {
  const data = await graphqlRequest({ query: EVENT_PARTICIPANTS, variables: { eventId }, operationName: 'EventParticipants' })
  return unwrapGraphqlResult(data.eventParticipants)
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
    operationName: legacy ? 'RegisterForEvent' : 'CreateSelfEventEntries',
  })
  return unwrapGraphqlResult(legacy ? data.registerForEvent : data.createSelfEventEntries)
}

export async function addEventParticipant(input) {
  const data = await graphqlRequest({
    query: ADD_EVENT_PARTICIPANT,
    variables: { input },
    operationName: 'CreateEventEntriesForParticipant',
  })
  return unwrapGraphqlResult(data.createEventEntriesForParticipant)
}

export async function removeEventParticipant(input) {
  const data = await graphqlRequest({
    query: REMOVE_EVENT_PARTICIPANT,
    variables: { input },
    operationName: 'RemoveEventParticipant',
  })
  return unwrapGraphqlResult(data.removeEventParticipant)
}

export async function archiveEventEntry(input) {
  const data = await graphqlRequest({ query: ARCHIVE_EVENT_ENTRY, variables: { input }, operationName: 'ArchiveEventEntry' })
  return unwrapGraphqlResult(data.archiveEventEntry)
}

export async function archiveEventParticipantEntries(input) {
  const data = await graphqlRequest({ query: ARCHIVE_EVENT_PARTICIPANT_ENTRIES, variables: { input },
    operationName: 'ArchiveEventParticipantEntries' })
  return unwrapGraphqlResult(data.archiveEventParticipantEntries)
}

export async function addEventCategory(input) {
  const data = await graphqlRequest({ query: ADD_EVENT_CATEGORY, variables: { input }, operationName: 'AddEventCategory' })
  return unwrapGraphqlResult(data.addEventCategory)
}

export async function renameEventCategory(input) {
  const data = await graphqlRequest({ query: RENAME_EVENT_CATEGORY, variables: { input }, operationName: 'RenameEventCategory' })
  return unwrapGraphqlResult(data.renameEventCategory)
}

export async function updateEventCategory(input) {
  const data = await graphqlRequest({ query: UPDATE_EVENT_CATEGORY, variables: { input }, operationName: 'UpdateEventCategory' })
  return unwrapGraphqlResult(data.updateEventCategory)
}

export async function archiveEventCategory(input) {
  const data = await graphqlRequest({ query: ARCHIVE_EVENT_CATEGORY, variables: { input },
    operationName: 'ArchiveEventCategory' })
  return normalizeEventSetup(unwrapGraphqlResult(data.archiveEventCategory))
}

export async function loadEntryOwnerChoices(eventId, search = null, first = 10) {
  const data = await graphqlRequest({ query: ENTRY_OWNER_CHOICES,
    variables: { eventId, search: search || null, first }, operationName: 'EntryOwnerChoices' })
  return unwrapGraphqlResult(data.entryOwnerChoices)
}

export async function createSingleEventEntry(input) {
  const data = await graphqlRequest({ query: CREATE_EVENT_ENTRY, variables: { input }, operationName: 'CreateEventEntry' })
  return unwrapGraphqlResult(data.createEventEntry)
}
