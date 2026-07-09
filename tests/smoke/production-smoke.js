const origin = process.env.PRODUCTION_ORIGIN
const publicEventPath = process.env.PRODUCTION_PUBLIC_EVENT_PATH ?? ''
const expectedCommit = process.env.PRODUCTION_EXPECTED_COMMIT ?? ''

if (!origin) throw new Error('PRODUCTION_ORIGIN is required')

async function fetchText(path) {
  const response = await fetch(`${origin}${path}`)
  return { response, body: await response.text() }
}

function requireStatus(ok, message) {
  if (!ok) throw new Error(message)
}

async function main() {
  const health = await fetchText('/health')
  requireStatus(health.response.ok, `Health failed: ${health.response.status}`)

  const ready = await fetchText('/ready')
  requireStatus(ready.response.ok, `Ready failed: ${ready.response.status}`)

  const home = await fetchText('/')
  requireStatus(home.response.ok, `Home failed: ${home.response.status}`)
  requireStatus(home.body.includes('Voting events without the spreadsheet chaos.'), 'Home shell missing expected copy')

  if (publicEventPath) {
    const eventPage = await fetchText(publicEventPath)
    requireStatus(eventPage.response.ok, `Public event failed: ${eventPage.response.status}`)
  }

  const deployedCommit = health.response.headers.get('x-app-commit') ?? ready.response.headers.get('x-app-commit')
  if (expectedCommit && deployedCommit) {
    requireStatus(
      deployedCommit.startsWith(expectedCommit.slice(0, 7)),
      `Commit mismatch. expected=${expectedCommit} actual=${deployedCommit}`,
    )
  }

  console.log('Production smoke passed')
}

await main()
