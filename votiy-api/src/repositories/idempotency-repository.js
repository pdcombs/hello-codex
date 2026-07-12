export function createIdempotencyRepository(database) {
  const collection = database.collection('idempotencyRecords')
  return Object.freeze({
    find({ scope, operation, key }, options = {}) {
      return collection.findOne({ scope, operation, key }, options)
    },
    async create(record, options = {}) {
      await collection.insertOne(record, options)
      return record
    },
  })
}
