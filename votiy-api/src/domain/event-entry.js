import { ObjectId } from 'mongodb'

export function createEntry({ title, categoryId, createdByAccountId, now = new Date(), id = new ObjectId() }) {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  if (!trimmed || trimmed.length > 160) throw new TypeError('Invalid entry title')
  if (!categoryId || !createdByAccountId) throw new TypeError('Entry category and creator are required')
  return Object.freeze({
    _id: id instanceof ObjectId ? id : new ObjectId(id),
    categoryId: categoryId instanceof ObjectId ? categoryId : new ObjectId(categoryId),
    title: trimmed,
    createdByAccountId: createdByAccountId instanceof ObjectId
      ? createdByAccountId
      : new ObjectId(createdByAccountId),
    createdAt: now,
    schemaVersion: 1,
  })
}

export function toEntryView(entry, owner) {
  return Object.freeze({
    id: String(entry._id), title: entry.title, categoryId: String(entry.categoryId),
    ownerAccountId: String(owner._id ?? owner.id), ownerDisplayName: owner.displayName,
    createdAt: entry.createdAt,
  })
}
