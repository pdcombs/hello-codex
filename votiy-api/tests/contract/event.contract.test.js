import { graphql } from 'graphql'
import { describe, expect, it, vi } from 'vitest'
import { createEventResolvers } from '../../src/api/graphql/event-resolvers.js'
import { createGraphqlSchema } from '../../src/api/graphql/schema.js'

const OWNED_EVENTS = `
  query OwnedEvents {
    ownedEvents {
      __typename
      ... on EventListSuccess { events { nodes { id publicId title registrationPolicy isOwner } nextCursor } }
      ... on OperationError { code message }
    }
  }
`

const CREATE_EVENT = `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      __typename
      ... on EventSuccess { event { id publicId title registrationPolicy isOwner } }
      ... on OperationError { code message fieldErrors { field message } }
    }
  }
`

function createHarness() {
  const eventService = {
    ownedEvents: vi.fn().mockResolvedValue({
      events: { nodes: [{ id: 'event-1', publicId: 'pub-1', title: 'Team awards', registrationPolicy: 'OPEN', isOwner: true }], nextCursor: null },
    }),
    eventByPublicId: vi.fn().mockResolvedValue({
      event: { id: 'event-1', publicId: 'pub-1', title: 'Team awards', registrationPolicy: 'OPEN', isOwner: true },
    }),
    createEvent: vi.fn().mockResolvedValue({
      event: { id: 'event-1', publicId: 'pub-1', title: 'Team awards', registrationPolicy: 'OPEN', isOwner: true },
    }),
    setRegistrationPolicy: vi.fn().mockResolvedValue({
      event: { id: 'event-1', publicId: 'pub-1', title: 'Team awards', registrationPolicy: 'ADMIN_MANAGED', isOwner: true },
    }),
  }
  const eventRegistrationService = {
    listRegistrations: vi.fn().mockResolvedValue({ registrations: [] }),
    registerForEvent: vi.fn().mockResolvedValue({
      registration: {
        id: 'registration-1',
        accountId: 'account-1',
        email: 'host@example.com',
        phone: null,
        accountCompleted: true,
        status: 'REGISTERED',
        source: 'SELF',
        createdAt: new Date('2026-07-07T02:00:00.000Z'),
      },
    }),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
  }
  const rootValue = createEventResolvers({ eventService, eventRegistrationService, auditRepository: { append: vi.fn().mockResolvedValue(undefined) } })
  return { rootValue, eventService }
}

async function execute({ source, rootValue, contextValue, variableValues }) {
  return graphql({
    schema: await createGraphqlSchema(),
    source,
    rootValue,
    contextValue,
    variableValues,
  })
}

describe('event GraphQL contract', () => {
  it('returns owned event list shape for authenticated viewer', async () => {
    const harness = createHarness()
    const result = await execute({
      source: OWNED_EVENTS,
      rootValue: harness.rootValue,
      contextValue: { correlationId: 'cor-1', viewer: { account: { _id: 'account-1' } } },
    })
    expect(result.errors).toBeUndefined()
    expect(result.data.ownedEvents.__typename).toBe('EventListSuccess')
    expect(result.data.ownedEvents.events.nodes[0].publicId).toBe('pub-1')
  })

  it('returns event mutation success union shape', async () => {
    const harness = createHarness()
    const result = await execute({
      source: CREATE_EVENT,
      rootValue: harness.rootValue,
      contextValue: { correlationId: 'cor-1', viewer: { account: { _id: 'account-1' } } },
      variableValues: {
        input: {
          title: 'Team awards',
          description: null,
          location: null,
          registrationPolicy: 'OPEN',
          idempotencyKey: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        },
      },
    })
    expect(result.errors).toBeUndefined()
    expect(result.data.createEvent.__typename).toBe('EventSuccess')
    expect(result.data.createEvent.event.isOwner).toBe(true)
  })
})
