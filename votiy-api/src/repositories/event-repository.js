import { ObjectId } from 'mongodb'
import { createEventDocument, withEventVersion2 } from '../domain/event.js'
import { normalizeCategoryTitle } from '../domain/event-category.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRepository(database) {
  const collection = database.collection('events')

  return Object.freeze({
    async create(input, options = {}) {
      const event = input.schemaVersion === 2
        ? withEventVersion2(createEventDocument(input), { now: input.now })
        : createEventDocument(input)
      await collection.insertOne(event, options)
      return event
    },
    findById(eventId, options = {}) {
      return collection.findOne({ _id: id(eventId) }, options)
    },
    findByPublicId(publicId, options = {}) {
      return collection.findOne({ publicId }, options)
    },
    async requireCategoryIds(eventId, categoryIds, options = {}) {
      const event = await collection.findOne({ _id: id(eventId) }, { projection: { categories: 1 }, ...options })
      if (!event) return null
      const available = new Set((event.categories ?? []).filter(({ status }) => status !== 'archived')
        .map(({ _id }) => String(_id)))
      return categoryIds.every((categoryId) => available.has(String(categoryId))) ? event : null
    },
    appendCategory(eventId, ownerAccountId, category, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), 'categories.99': { $exists: false },
          categories: { $not: { $elemMatch: { titleNormalized: category.titleNormalized, status: { $ne: 'archived' } } } } },
        { $push: { categories: category }, $set: { updatedAt: category.updatedAt } },
        { returnDocument: 'after', ...options },
      )
    },
    renameCategory(eventId, ownerAccountId, categoryId, title, now, options = {}) {
      const normalized = normalizeCategoryTitle(title)
      const categoryObjectId = id(categoryId)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId),
          categories: { $elemMatch: { _id: categoryObjectId, status: { $ne: 'archived' } } },
          $expr: { $not: { $in: [normalized, { $map: {
            input: { $filter: { input: '$categories', as: 'category', cond: { $and: [
              { $ne: ['$$category._id', categoryObjectId] }, { $ne: ['$$category.status', 'archived'] },
            ] } } },
            as: 'category', in: '$$category.titleNormalized',
          } }] } } },
        { $set: { 'categories.$[category].title': title, 'categories.$[category].titleNormalized': normalized,
          'categories.$[category].updatedAt': now, updatedAt: now } },
        { returnDocument: 'after', arrayFilters: [{ 'category._id': categoryObjectId }], ...options },
      )
    },
    updateCategoryTitle(eventId, ownerAccountId, categoryId, title, expectedUpdatedAt, now, options = {}) {
      const normalized = normalizeCategoryTitle(title)
      const categoryObjectId = id(categoryId)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId),
          categories: { $elemMatch: { _id: categoryObjectId, updatedAt: expectedUpdatedAt,
            status: { $ne: 'archived' } } },
          $expr: { $not: { $in: [normalized, { $map: {
            input: { $filter: { input: '$categories', as: 'category', cond: { $and: [
              { $ne: ['$$category._id', categoryObjectId] }, { $ne: ['$$category.status', 'archived'] },
            ] } } },
            as: 'category', in: '$$category.titleNormalized',
          } }] } } },
        { $set: { 'categories.$[category].title': title, 'categories.$[category].titleNormalized': normalized,
          'categories.$[category].updatedAt': now, updatedAt: now } },
        { returnDocument: 'after', arrayFilters: [{ 'category._id': categoryObjectId }], ...options },
      )
    },
    touch(eventId, ownerAccountId, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId) },
        { $set: { updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    archiveCategory({ eventId, ownerAccountId, categoryId, expectedEventUpdatedAt,
      expectedCategoryUpdatedAt, categories, now }, options = {}) {
      const categoryObjectId = id(categoryId)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), updatedAt: expectedEventUpdatedAt,
          categories: { $elemMatch: { _id: categoryObjectId, updatedAt: expectedCategoryUpdatedAt,
            status: { $ne: 'archived' } } },
          $expr: { $gt: [{ $size: { $filter: { input: '$categories', as: 'category',
            cond: { $ne: ['$$category.status', 'archived'] } } } }, 1] } },
        { $set: { categories, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    listByOwner(ownerAccountId, { first = 20, after = null } = {}) {
      const query = { ownerAccountId: id(ownerAccountId) }
      if (after) query.createdAt = { $lt: new Date(after) }
      return collection.find(query).sort({ createdAt: -1 }).limit(first + 1).toArray()
    },
    updateRegistrationPolicy(eventId, ownerAccountId, registrationPolicy, now) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId) },
        { $set: { registrationPolicy, updatedAt: now } },
        { returnDocument: 'after' },
      )
    },
  })
}
