export function createIdempotencyRepository(database) {
  const collection = database.collection('idempotencyRecords')
  return Object.freeze({
    find({ scope, operation, key }) {
      return collection.findOne({ scope, operation, key })
    },
    async create(record) {
      await collection.insertOne(record)
      return record
    },
  })
}
