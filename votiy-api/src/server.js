import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSchema, graphql } from 'graphql'
import { MongoClient } from 'mongodb'
import { createApplication, securityHeaders } from './app.js'
import { loadEnvironment } from './config/env.js'

const environment = loadEnvironment()
const sourceDirectory = dirname(fileURLToPath(import.meta.url))
const frontendDirectory = join(sourceDirectory, '..', '..', 'votiy-web', 'dist')
const mongoClient = new MongoClient(environment.mongoUri, { maxPoolSize: 10 })
const wordsCollection = mongoClient.db(environment.mongoDatabase).collection('words')

const seedWords = ['aurora', 'breeze', 'comet', 'dandelion', 'ember', 'fjord', 'galaxy', 'horizon', 'island', 'jasmine']
const schema = buildSchema('type Query { message: String! }')
let lastWord

async function ensureWordsExist() {
  if (await wordsCollection.estimatedDocumentCount() === 0) {
    await wordsCollection.insertMany(seedWords.map((value) => ({ value })))
  }
}

async function randomWord() {
  const documents = await wordsCollection.find({}, { projection: { _id: 0, value: 1 } }).toArray()
  const words = documents.map(({ value }) => value)
  if (words.length === 0) throw new Error('The word collection is empty')
  const choices = words.filter((word) => word !== lastWord)
  const pool = choices.length > 0 ? choices : words
  lastWord = pool[Math.floor(Math.random() * pool.length)]
  return lastWord
}

async function readJsonBody(request, maximumBytes = 2_000) {
  const chunks = []
  let bytes = 0
  for await (const chunk of request) {
    bytes += chunk.length
    if (bytes > maximumBytes) throw new Error('Request too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function graphqlHandler(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405, { ...securityHeaders('application/json'), Allow: 'POST' })
    return response.end(JSON.stringify({ error: 'Method not allowed' }))
  }

  try {
    const { query, variables } = await readJsonBody(request)
    const result = await graphql({
      schema,
      source: query,
      rootValue: { message: randomWord },
      variableValues: variables,
    })
    response.writeHead(200, securityHeaders('application/json'))
    response.end(JSON.stringify(result))
  } catch {
    response.writeHead(400, securityHeaders('application/json'))
    response.end(JSON.stringify({ error: 'Invalid request' }))
  }
}

function healthHandler(_request, response) {
  response.writeHead(200, securityHeaders('application/json'))
  response.end(JSON.stringify({ status: 'ok' }))
}

const application = createApplication({ frontendDirectory, graphqlHandler, healthHandler })
const server = createServer(application)
const host = environment.isProduction ? '0.0.0.0' : '127.0.0.1'

await mongoClient.connect()
await ensureWordsExist()

server.listen(environment.port, host, () => {
  console.log(`Votiy API running at http://${host}:${environment.port}`)
})

async function shutdown() {
  server.close()
  await mongoClient.close()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
