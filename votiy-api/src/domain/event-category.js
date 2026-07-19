import { ObjectId } from 'mongodb'

export function normalizeCategoryTitle(title) {
  return title.trim().toLocaleLowerCase('en-US')
}

export function createCategory({ title, isDefault = false, now = new Date(), id = new ObjectId() }) {
  const trimmed = typeof title === 'string' ? title.trim() : ''
  if (!trimmed || trimmed.length > 120) throw new TypeError('Invalid category title')
  return Object.freeze({
    _id: id instanceof ObjectId ? id : new ObjectId(id),
    title: trimmed,
    titleNormalized: normalizeCategoryTitle(trimmed),
    isDefault: Boolean(isDefault),
    status: 'active',
    archiveReason: null,
    archivedAt: null,
    archivedByAccountId: null,
    createdAt: now,
    updatedAt: now,
  })
}

export function toCategoryView(category, entries = []) {
  return Object.freeze({
    id: String(category._id), title: category.title, isDefault: category.isDefault,
    entries, createdAt: category.createdAt, updatedAt: category.updatedAt,
  })
}

export function isActiveCategory(category) {
  return category?.status !== 'archived'
}
