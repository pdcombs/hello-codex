import { ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { createEventDocument, toEventView } from '../../src/domain/event.js'
import { createEventRegistrationDocument, toEventRegistrationView } from '../../src/domain/event-registration.js'

describe('event domain helpers', () => {
  it('creates event documents and rejects invalid policy', () => {
    const ownerAccountId = new ObjectId()
    const event = createEventDocument({
      ownerAccountId,
      publicId: 'public-id',
      title: 'Board vote',
      description: '<b>hello</b>',
      location: 'Remote',
      registrationPolicy: 'open',
    })

    expect(event.ownerAccountId).toEqual(ownerAccountId)
    expect(event.registrationPolicy).toBe('open')
    expect(() =>
      createEventDocument({
        ownerAccountId,
        publicId: 'bad',
        title: 'Broken',
        registrationPolicy: 'wrong',
      }),
    ).toThrow('Invalid event')
  })

  it('maps event views for owner and public visitor', () => {
    const ownerAccountId = new ObjectId()
    const event = createEventDocument({
      ownerAccountId,
      publicId: 'public-id',
      title: 'Board vote',
    })

    expect(toEventView(event, ownerAccountId)).toMatchObject({
      publicId: 'public-id',
      title: 'Board vote',
      registrationPolicy: 'ADMIN_MANAGED',
      isOwner: true,
    })
    expect(toEventView({ ...event, registrationPolicy: 'open' }, null)).toMatchObject({
      registrationPolicy: 'OPEN',
      isOwner: false,
    })
  })

  it('creates registration documents and maps completed or provisional accounts', () => {
    const registration = createEventRegistrationDocument({
      eventId: new ObjectId(),
      accountId: new ObjectId(),
      registrationSource: 'host',
      registeredByAccountId: new ObjectId(),
    })

    expect(registration.status).toBe('registered')
    expect(() =>
      createEventRegistrationDocument({
        eventId: new ObjectId(),
        accountId: new ObjectId(),
        registrationSource: 'nope',
        registeredByAccountId: new ObjectId(),
      }),
    ).toThrow('Invalid event registration')

    expect(
      toEventRegistrationView(registration, {
        emailNormalized: 'guest@example.com',
        phoneNormalized: null,
        lifecycleStatus: 'completed',
      }),
    ).toMatchObject({
      email: 'guest@example.com',
      accountCompleted: true,
      source: 'HOST',
      status: 'REGISTERED',
    })

    expect(
      toEventRegistrationView({ ...registration, status: 'removed', registrationSource: 'self' }, {
        emailNormalized: null,
        phoneNormalized: '+15555550123',
        lifecycleStatus: 'provisional',
      }),
    ).toMatchObject({
      phone: '+15555550123',
      accountCompleted: false,
      source: 'SELF',
      status: 'REMOVED',
    })
  })
})
