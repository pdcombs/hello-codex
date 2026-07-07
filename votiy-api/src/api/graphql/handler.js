import { defaultFieldResolver, getOperationAST, graphql } from 'graphql'
import { securityHeaders } from '../../app.js'
import { getRequestContext } from '../../observability/request-context.js'
import { validateGraphqlOperation } from './schema.js'

function parseOrigin(value) {
  try {
    return value ? new URL(value) : null
  } catch {
    return null
  }
}

function isLoopbackHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function isAllowedMutationOrigin(origin, appOrigin, isProduction) {
  if (origin === appOrigin) return true
  if (isProduction) return false

  const actual = parseOrigin(origin)
  const expected = parseOrigin(appOrigin)
  if (!actual || !expected) return false

  return (
    actual.protocol === expected.protocol
    && actual.port === expected.port
    && isLoopbackHostname(actual.hostname)
    && isLoopbackHostname(expected.hostname)
  )
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, { ...securityHeaders('application/json'), ...extraHeaders })
  response.end(JSON.stringify(body))
}

function rootValueFieldResolver(source, args, contextValue, info) {
  const property = source?.[info.fieldName]
  if (typeof property === 'function') return property(args, contextValue, info)
  return defaultFieldResolver(source, args, contextValue, info)
}

async function readBody(request, maximumBytes) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maximumBytes) throw new Error('REQUEST_TOO_LARGE')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function createGraphqlHandler({
  schema,
  appOrigin,
  isProduction = false,
  rootValue,
  contextFactory = () => ({}),
  rateLimiter = async () => ({ allowed: true }),
  maximumBodyBytes = 64 * 1024,
  maximumQueryCharacters = 20_000,
}) {
  if (!schema || !appOrigin) throw new TypeError('GraphQL schema and application origin are required')

  return async function graphqlHandler(request, response) {
    if (request.method !== 'POST') {
      return sendJson(response, 405, { error: 'Method not allowed' }, { Allow: 'POST' })
    }
    if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      return sendJson(response, 415, { error: 'Content-Type must be application/json' })
    }

    const correlationId = getRequestContext()?.correlationId ?? null
    try {
      const body = await readBody(request, maximumBodyBytes)
      if (typeof body.query !== 'string' || body.query.length === 0 || body.query.length > maximumQueryCharacters) {
        return sendJson(response, 400, { error: 'Invalid GraphQL request', correlationId })
      }
      if (body.variables != null && (typeof body.variables !== 'object' || Array.isArray(body.variables))) {
        return sendJson(response, 400, { error: 'Invalid GraphQL variables', correlationId })
      }

      const { document, errors } = validateGraphqlOperation(schema, body.query, { isProduction })
      if (errors.length > 0) return sendJson(response, 400, { errors: errors.map(({ message }) => ({ message })), correlationId })
      const operation = getOperationAST(document, body.operationName)
      if (!operation) return sendJson(response, 400, { error: 'GraphQL operation is required', correlationId })

      if (operation.operation === 'mutation') {
        const origin = request.headers.origin
        if (!isAllowedMutationOrigin(origin, appOrigin, isProduction) || request.headers['x-requested-with'] !== 'votiy-web') {
          return sendJson(response, 403, { error: 'Forbidden', correlationId })
        }
      }

      const limit = await rateLimiter({ request, operationType: operation.operation, operationName: body.operationName })
      if (!limit.allowed) {
        return sendJson(response, 429, { error: 'Too many requests', correlationId }, {
          'Retry-After': String(limit.retryAfterSeconds ?? 60),
        })
      }

      const result = await graphql({
        schema, source: body.query, rootValue, variableValues: body.variables,
        operationName: body.operationName,
        contextValue: await contextFactory({ request, response, correlationId }),
        fieldResolver: rootValueFieldResolver,
      })
      return sendJson(response, 200, result)
    } catch (error) {
      const status = error.message === 'REQUEST_TOO_LARGE' ? 413 : 400
      return sendJson(response, status, { error: 'Invalid GraphQL request', correlationId })
    }
  }
}
