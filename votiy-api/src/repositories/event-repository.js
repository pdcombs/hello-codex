import { ObjectId } from 'mongodb'
import { createEventDocument, withEventVersion2, withEventVersion3, withEventVersion4, withEventVersion5 } from '../domain/event.js'
import { createEventSearchProjection, eventMatchesTerms, eventSearchScore } from '../domain/event-search.js'
import { normalizeCategoryTitle } from '../domain/event-category.js'

const id = (value) => (value instanceof ObjectId ? value : new ObjectId(value))

export function createEventRepository(database) {
  const collection = database.collection('events')

  return Object.freeze({
    async create(input, options = {}) {
      const base = createEventDocument(input)
      const event = input.schemaVersion === 5 ? withEventVersion5(withEventVersion4(withEventVersion3(base, { now: input.now })), { now: input.now })
        : input.schemaVersion === 4 ? withEventVersion4(withEventVersion3(base, { now: input.now }))
        : input.schemaVersion === 3 ? withEventVersion3(base, { now: input.now })
        : input.schemaVersion === 2 ? withEventVersion2(base, { now: input.now }) : base
      await collection.insertOne(event, options)
      return event
    },
    findById(eventId, options = {}) {
      return collection.findOne({ _id: id(eventId) }, options)
    },
    findByPublicId(publicId, options = {}) {
      return collection.findOne({ publicId }, options)
    },
    async search({ terms, first, cursor = null }) {
      const requiredGrams = [...new Set(terms.flatMap((term) => term.length === 2 ? [term] : [term.slice(0, 2), term.slice(0, 3)]))]
      const rows = await collection.find({
        lifecycleStatus: 'active', visibility: { $in: ['public', 'private'] },
        searchGrams: { $all: requiredGrams },
      }, { projection: {
        publicId: 1, title: 1, description: 1, location: 1, visibility: 1, createdAt: 1,
        searchTitleNormalized: 1, searchDescriptionNormalized: 1, searchLocationNormalized: 1,
      } }).toArray()
      return rows.filter((event) => eventMatchesTerms(event, terms)).map((event) => ({
        ...event, searchScore: eventSearchScore(event, terms),
      })).filter((event) => !cursor || event.searchScore < cursor.score
        || (event.searchScore === cursor.score && event.createdAt < new Date(cursor.createdAt))
        || (event.searchScore === cursor.score && event.createdAt.getTime() === new Date(cursor.createdAt).getTime()
          && String(event._id) > cursor.id))
        .sort((a, b) => b.searchScore - a.searchScore || b.createdAt - a.createdAt
          || String(a._id).localeCompare(String(b._id))).slice(0, first + 1)
    },
    setVisibility(eventId, ownerAccountId, visibility, expectedUpdatedAt, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: 'active',
          updatedAt: expectedUpdatedAt },
        { $set: { visibility, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    archiveEvent(eventId, ownerAccountId, expectedUpdatedAt, now, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: 'active',
          updatedAt: expectedUpdatedAt },
        { $set: { lifecycleStatus: 'archived', archivedAt: now, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    updateDetails(eventId, ownerAccountId, expectedUpdatedAt, details, now, options = {}) {
      const projection = createEventSearchProjection(details)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: 'active',
          updatedAt: expectedUpdatedAt },
        { $set: { ...details, ...projection, updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    async requireCategoryIds(eventId, categoryIds, options = {}) {
      const event = await collection.findOne({ _id: id(eventId), lifecycleStatus: { $ne: 'archived' } },
        { projection: { categories: 1 }, ...options })
      if (!event) return null
      const available = new Set((event.categories ?? []).filter(({ status }) => status !== 'archived')
        .map(({ _id }) => String(_id)))
      return categoryIds.every((categoryId) => available.has(String(categoryId))) ? event : null
    },
    appendCategory(eventId, ownerAccountId, category, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' },
          'categories.99': { $exists: false },
          categories: { $not: { $elemMatch: { titleNormalized: category.titleNormalized, status: { $ne: 'archived' } } } } },
        { $push: { categories: category }, $set: { updatedAt: category.updatedAt } },
        { returnDocument: 'after', ...options },
      )
    },
    renameCategory(eventId, ownerAccountId, categoryId, title, now, options = {}) {
      const normalized = normalizeCategoryTitle(title)
      const categoryObjectId = id(categoryId)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' },
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
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' },
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
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' } },
        { $set: { updatedAt: now } },
        { returnDocument: 'after', ...options },
      )
    },
    archiveCategory({ eventId, ownerAccountId, categoryId, expectedEventUpdatedAt,
      expectedCategoryUpdatedAt, categories, now }, options = {}) {
      const categoryObjectId = id(categoryId)
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' },
          updatedAt: expectedEventUpdatedAt,
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
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' } },
        { $set: { registrationPolicy, updatedAt: now } },
        { returnDocument: 'after' },
      )
    },
    updateVotingRules(eventId, ownerAccountId, expectedUpdatedAt, expectedRulesVersion, votingRules, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: { $ne: 'archived' },
          updatedAt: expectedUpdatedAt,
          'votingRules.version': expectedRulesVersion },
        { $set: { votingRules, updatedAt: votingRules.updatedAt } },
        { returnDocument: 'after', ...options },
      )
    },
    transitionVotingState(eventId, ownerAccountId, expectedVersion, currentStatus, votingState, options = {}) {
      return collection.findOneAndUpdate(
        { _id: id(eventId), ownerAccountId: id(ownerAccountId), lifecycleStatus: 'active',
          'votingState.version': expectedVersion, 'votingState.status': currentStatus },
        { $set: { votingState, updatedAt: votingState.updatedAt } },
        { returnDocument: 'after', ...options },
      )
    },
  })
}
