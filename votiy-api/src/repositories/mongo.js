import { MongoClient } from 'mongodb'

export function createMongoConnection({ uri, databaseName, clientOptions = {} }) {
  if (!uri || !databaseName) throw new TypeError('MongoDB URI and database name are required')

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
    ...clientOptions,
  })
  const database = client.db(databaseName)
  let connected = false

  return Object.freeze({
    client,
    database,
    collection(name) {
      return database.collection(name)
    },
    async withTransaction(operation, options = {}) {
      const session = client.startSession()
      try {
        let result
        await session.withTransaction(async () => { result = await operation(session) }, options)
        return result
      } finally {
        await session.endSession()
      }
    },
    async connect() {
      await client.connect()
      await database.command({ ping: 1 })
      connected = true
      return database
    },
    async isReady() {
      if (!connected) return false
      try {
        await database.command({ ping: 1, maxTimeMS: 1_000 })
        return true
      } catch {
        return false
      }
    },
    async close() {
      connected = false
      await client.close()
    },
  })
}
