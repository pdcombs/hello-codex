export class GraphqlClientError extends Error {
  constructor(message, { code = 'SERVICE_UNAVAILABLE', correlationId = null, fieldErrors = [], cause } = {}) {
    super(message, { cause })
    this.name = 'GraphqlClientError'
    this.code = code
    this.correlationId = correlationId
    this.fieldErrors = fieldErrors
  }
}

function operationError(value) {
  return value && value.__typename === 'OperationError'
}

export function unwrapGraphqlResult(value) {
  if (operationError(value)) {
    throw new GraphqlClientError(value.message, {
      code: value.code,
      correlationId: value.correlationId,
      fieldErrors: value.fieldErrors ?? [],
    })
  }
  return value
}

export async function graphqlRequest({
  query,
  variables,
  operationName,
  signal,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof query !== 'string' || query.trim() === '') throw new TypeError('GraphQL query is required')
  if (typeof fetchImpl !== 'function') throw new TypeError('Fetch implementation is required')

  let response
  try {
    response = await fetchImpl('/graphql', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'votiy-web',
      },
      body: JSON.stringify({ query, variables, operationName }),
      signal,
    })
  } catch (cause) {
    throw new GraphqlClientError('Votiy could not be reached. Please try again.', { cause })
  }

  const headerCorrelationId = response.headers?.get?.('x-correlation-id') ?? null
  let payload
  try {
    payload = await response.json()
  } catch (cause) {
    throw new GraphqlClientError('Votiy returned an unreadable response.', {
      correlationId: headerCorrelationId,
      cause,
    })
  }

  if (!response.ok || payload.errors?.length) {
    const firstError = payload.errors?.[0]
    throw new GraphqlClientError(
      firstError?.message ?? payload.error ?? 'The request could not be completed.',
      {
        code: firstError?.extensions?.code ?? 'SERVICE_UNAVAILABLE',
        correlationId: payload.correlationId ?? firstError?.extensions?.correlationId ?? headerCorrelationId,
      },
    )
  }

  return payload.data
}
