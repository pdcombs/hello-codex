import { randomUUID } from 'node:crypto'
import { MongoClient } from 'mongodb'

export async function createTestMongo() {
  const uri = process.env.MONGODB_TEST_URI ?? 'mongodb://root:localpassword@127.0.0.1:27017/?authSource=admin'
  const databaseName = `votiy_test_${randomUUID().replaceAll('-', '')}`
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5_000 })
  await client.connect()
  const database = client.db(databaseName)
  return {
    client,
    database,
    async cleanup() {
      await database.dropDatabase()
      await client.close()
    },
  }
}
