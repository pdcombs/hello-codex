import { ObjectId } from 'mongodb'

const REGISTRATION_POLICIES = new Set(['admin_managed', 'open'])

export function createEventDocument({
  ownerAccountId,
  publicId,
  title,
  description = null,
  location = null,
  registrationPolicy = 'admin_managed',
  now = new Date(),
}) {
  if (
    !ownerAccountId ||
    !publicId ||
    !title ||
    !REGISTRATION_POLICIES.has(registrationPolicy)
  ) throw new TypeError('Invalid event')

  return Object.freeze({
    _id: new ObjectId(),
    ownerAccountId: ownerAccountId instanceof ObjectId ? ownerAccountId : new ObjectId(ownerAccountId),
    publicId,
    title,
    description,
    location,
    registrationPolicy,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  })
}

export function toEventView(event, viewerAccountId = null) {
  const ownerId = String(event.ownerAccountId)
  return Object.freeze({
    id: String(event._id),
    publicId: event.publicId,
    title: event.title,
    description: event.description,
    location: event.location,
    registrationPolicy: event.registrationPolicy === 'open' ? 'OPEN' : 'ADMIN_MANAGED',
    isOwner: viewerAccountId ? String(viewerAccountId) === ownerId : false,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  })
}
