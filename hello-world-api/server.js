import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSchema, graphql } from 'graphql'
import { MongoClient } from 'mongodb'

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT ?? 4000)
const host = isProduction ? '0.0.0.0' : '127.0.0.1'
const apiDirectory = dirname(fileURLToPath(import.meta.url))
const frontendDirectory = join(apiDirectory, '..', 'hello-world', 'dist')

const seedWords = [
  'aurora',
  'breeze',
  'comet',
  'dandelion',
  'ember',
  'fjord',
  'galaxy',
  'horizon',
  'island',
  'jasmine',
]

const schema = buildSchema(`
  type Query {
    message: String!
  }
`)

const mongoUrl = process.env.MONGODB_URI
  ?? 'mongodb://root:localpassword@127.0.0.1:27017/hello_world?authSource=admin'
const mongoClient = new MongoClient(mongoUrl, { maxPoolSize: 10 })
const wordsCollection = mongoClient.db('hello_world').collection('words')
const rateLimits = new Map()
let lastWord

async function ensureWordsExist() {
  if (await wordsCollection.estimatedDocumentCount() === 0) {
    await wordsCollection.insertMany(seedWords.map((value) => ({ value })))
  }
}

async function randomWord() {
  const documents = await wordsCollection
    .find({}, { projection: { _id: 0, value: 1 } })
    .toArray()
  const words = documents.map(({ value }) => value)

  if (words.length === 0) throw new Error('The word collection is empty')

  const availableWords = words.filter((word) => word !== lastWord)
  const choices = availableWords.length > 0 ? availableWords : words
  lastWord = choices[Math.floor(Math.random() * choices.length)]
  return lastWord
}

const rootValue = { message: randomWord }

function securityHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
}

function clientAddress(request) {
  return request.headers['x-forwarded-for']?.split(',')[0].trim()
    ?? request.socket.remoteAddress
    ?? 'unknown'
}

function isRateLimited(request) {
  const now = Date.now()
  const address = clientAddress(request)
  const current = rateLimits.get(address)

  if (!current || current.resetAt <= now) {
    rateLimits.set(address, { count: 1, resetAt: now + 60_000 })
    return false
  }

  current.count += 1
  return current.count > 30
}

function hasValidOrigin(request) {
  if (!isProduction) return true

  const origin = request.headers.origin
  const forwardedHost = request.headers['x-forwarded-host'] ?? request.headers.host
  const expectedOrigin = `https://${forwardedHost}`
  return origin === expectedOrigin && request.headers['x-requested-with'] === 'hello-world'
}

async function readRequestBody(request) {
  let body = ''

  for await (const chunk of request) {
    body += chunk
    if (body.length > 2_000) throw new Error('Request too large')
  }

  return JSON.parse(body)
}

async function handleGraphql(request, response) {
  if (request.method !== 'POST') {
    response.writeHead(405, { ...securityHeaders('application/json'), Allow: 'POST' })
    response.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (!request.headers['content-type']?.startsWith('application/json') || !hasValidOrigin(request)) {
    response.writeHead(403, securityHeaders('application/json'))
    response.end(JSON.stringify({ error: 'Forbidden' }))
    return
  }

  if (isRateLimited(request)) {
    response.writeHead(429, { ...securityHeaders('application/json'), 'Retry-After': '60' })
    response.end(JSON.stringify({ error: 'Too many requests' }))
    return
  }

  try {
    const { query, variables } = await readRequestBody(request)

    if (typeof query !== 'string' || query.length > 500 || (isProduction && /__(schema|type)/.test(query))) {
      throw new Error('Invalid query')
    }

    const result = await graphql({ schema, source: query, rootValue, variableValues: variables })
    response.writeHead(200, securityHeaders('application/json'))
    response.end(JSON.stringify(result))
  } catch {
    response.writeHead(400, securityHeaders('application/json'))
    response.end(JSON.stringify({ error: 'Invalid request' }))
  }
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
}

async function serveFrontend(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : request.url
  const candidatePath = normalize(join(frontendDirectory, requestedPath))
  const filePath = candidatePath.startsWith(frontendDirectory) ? candidatePath : join(frontendDirectory, 'index.html')

  try {
    const file = await readFile(filePath)
    response.writeHead(200, securityHeaders(contentTypes[extname(filePath)] ?? 'application/octet-stream'))
    response.end(file)
  } catch {
    try {
      const index = await readFile(join(frontendDirectory, 'index.html'))
      response.writeHead(200, securityHeaders('text/html; charset=utf-8'))
      response.end(index)
    } catch {
      response.writeHead(404, securityHeaders('application/json'))
      response.end(JSON.stringify({ error: 'Not found' }))
    }
  }
}

const server = createServer(async (request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, securityHeaders('application/json'))
    response.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (request.url === '/graphql') {
    await handleGraphql(request, response)
    return
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    await serveFrontend(request, response)
    return
  }

  response.writeHead(404, securityHeaders('application/json'))
  response.end(JSON.stringify({ error: 'Not found' }))
})

await mongoClient.connect()
await ensureWordsExist()

server.listen(port, host, () => {
  console.log(`Application running at http://${host}:${port}`)
})

async function shutdown() {
  server.close()
  await mongoClient.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
