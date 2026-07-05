import { securityHeaders } from '../app.js'

function json(response, statusCode, body) {
  response.writeHead(statusCode, securityHeaders('application/json'))
  response.end(JSON.stringify(body))
}

export function createHealthHandlers({ mongo }) {
  if (!mongo) throw new TypeError('MongoDB connection is required')

  return Object.freeze({
    healthHandler(_request, response) {
      json(response, 200, { status: 'ok' })
    },
    async readyHandler(_request, response) {
      const databaseReady = await mongo.isReady()
      json(response, databaseReady ? 200 : 503, {
        status: databaseReady ? 'ready' : 'not_ready',
        dependencies: { mongodb: databaseReady ? 'ready' : 'unavailable' },
      })
    },
  })
}
