import { ObjectId } from 'mongodb'
import { createEventEntryDocument } from '../../src/domain/event-entry.js'

export function addEntriesFixture({ now = new Date('2026-07-19T12:00:00.000Z') } = {}) {
  const host = { _id: new ObjectId(), displayName: 'Host Person', emailNormalized: 'host@example.test' }
  const recentOwner = { _id: new ObjectId(), displayName: 'Recent Person',
    emailNormalized: 'recent@example.test', phoneNormalized: '+15551234567' }
  const otherAccount = { _id: new ObjectId(), displayName: 'Other Person',
    emailNormalized: 'other@example.test', phoneNormalized: null }
  const event = { _id: new ObjectId(), ownerAccountId: host._id, categories: [
    { _id: new ObjectId(), title: 'Entrants', isDefault: true },
    { _id: new ObjectId(), title: 'Finalists', isDefault: false },
  ] }
  const entry = createEventEntryDocument({ eventId: event._id, categoryId: event.categories[0]._id,
    ownerAccountId: recentOwner._id, createdByAccountId: host._id, title: 'Recent entry', now })
  return { host, recentOwner, otherAccount, event, entry, unusedContact: 'new.person@example.test', now }
}
