const origin = process.env.PRODUCTION_ORIGIN
const publicEventPath = process.env.PRODUCTION_PUBLIC_EVENT_PATH ?? ''
const expectedCommit = process.env.PRODUCTION_EXPECTED_COMMIT ?? ''

if (!origin) throw new Error('PRODUCTION_ORIGIN is required')

async function fetchText(path) {
  const response = await fetch(`${origin}${path}`)
  return { response, body: await response.text() }
}

async function graphql(query, variables) {
  const response = await fetch(`${origin}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'votiy-web' },
    body: JSON.stringify({ query, variables, operationName: 'SmokeEventSetup' }),
  })
  const payload = await response.json()
  requireStatus(response.ok && !payload.errors, `Setup GraphQL failed: status=${response.status} body=${JSON.stringify(payload)}`)
  return payload.data
}

function requireStatus(ok, message) {
  if (!ok) throw new Error(message)
}

async function main() {
  const health = await fetchText('/health')
  requireStatus(health.response.ok, `Health failed: ${health.response.status}`)

  const ready = await fetchText('/ready')
  requireStatus(ready.response.ok, `Ready failed: ${ready.response.status}`)
  const readiness = JSON.parse(ready.body)
  requireStatus(readiness.status === 'ready' && readiness.dependencies?.mongodb === 'ready',
    `Migration/setup readiness failed: ${ready.body}`)

  const home = await fetchText('/')
  requireStatus(home.response.ok, `Home failed: ${home.response.status}`)
  requireStatus(home.body.includes('<div id="root"></div>'), 'Home shell missing application root')

  if (publicEventPath) {
    const eventPage = await fetchText(publicEventPath)
    requireStatus(eventPage.response.ok, `Public event failed: ${eventPage.response.status}`)
    const publicId = decodeURIComponent(publicEventPath.split('/').filter(Boolean).at(-1))
    const data = await graphql(`query SmokeEventSetup($publicId: String!) {
      eventByPublicId(publicId: $publicId) {
        __typename
        ... on EventSuccess { event { publicId categories { id title entries { id title ownerDisplayName } } } }
        ... on OperationError { code message }
      }
    }`, { publicId })
    requireStatus(data.eventByPublicId?.__typename === 'EventSuccess',
      `Grouped setup read failed: ${JSON.stringify(data.eventByPublicId)}`)
    requireStatus(Array.isArray(data.eventByPublicId.event.categories), 'Grouped setup categories missing')
    requireStatus(!/"(email|phone|emailNormalized|phoneNormalized)"\s*:/.test(JSON.stringify(data)),
      'Grouped setup response exposed contact fields')
  }

  const deployedCommit = health.response.headers.get('x-app-commit') ?? ready.response.headers.get('x-app-commit')
  if (expectedCommit) {
    requireStatus(Boolean(deployedCommit), `Commit header missing. expected=${expectedCommit}`)
    requireStatus(deployedCommit === expectedCommit, `Commit mismatch. expected=${expectedCommit} actual=${deployedCommit}`)
  }

  console.log('Production smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
