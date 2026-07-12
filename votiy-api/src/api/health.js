import { securityHeaders } from '../app.js'

function json(response, statusCode, body) {
  response.writeHead(statusCode, securityHeaders('application/json'))
  response.end(JSON.stringify(body))
}

export function createHealthHandlers({ mongo, migrationReady = true }) {
  if (!mongo) throw new TypeError('MongoDB connection is required')

  return Object.freeze({
    healthHandler(_request, response) {
      json(response, 200, { status: 'ok' })
    },
    async readyHandler(_request, response) {
      const databaseReady = await mongo.isReady()
      const ready = databaseReady && migrationReady
      const dependencies = { mongodb: databaseReady ? 'ready' : 'unavailable' }
      if (!migrationReady) dependencies.migration = 'unavailable'
      json(response, ready ? 200 : 503, {
        status: ready ? 'ready' : 'not_ready',
        dependencies,
      })
    },
  })
}
