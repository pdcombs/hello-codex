const origin = process.env.PRODUCTION_ORIGIN
const publicEventPath = process.env.PRODUCTION_PUBLIC_EVENT_PATH ?? ''
const expectedCommit = process.env.PRODUCTION_EXPECTED_COMMIT ?? ''
const syntheticEmail = process.env.PRODUCTION_SYNTHETIC_HOST_EMAIL ?? ''
const syntheticPassword = process.env.PRODUCTION_SYNTHETIC_HOST_PASSWORD ?? ''
const syntheticEventId = process.env.PRODUCTION_SYNTHETIC_EVENT_ID ?? ''
const syntheticCategoryId = process.env.PRODUCTION_SYNTHETIC_CATEGORY_ID ?? ''

if (!origin) throw new Error('PRODUCTION_ORIGIN is required')

async function fetchText(path) {
  const response = await fetch(`${origin}${path}`)
  return { response, body: await response.text() }
}

async function graphql(query, variables, { cookie = '', operationName = 'SmokeEventSetup' } = {}) {
  const response = await fetch(`${origin}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'votiy-web', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ query, variables, operationName }),
  })
  const payload = await response.json()
  requireStatus(response.ok && !payload.errors, `Setup GraphQL failed: status=${response.status} body=${JSON.stringify(payload)}`)
  return { data: payload.data, response }
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
    const { data } = await graphql(`query SmokeEventSetup($publicId: String!) {
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

  const synthetic = [syntheticEmail, syntheticPassword, syntheticEventId, syntheticCategoryId]
  if (synthetic.some(Boolean)) {
    requireStatus(synthetic.every(Boolean), 'All PRODUCTION_SYNTHETIC_* variables are required together')
    const signIn = await graphql(`mutation SmokeSignIn($input: SignInInput!) {
      signIn(input: $input) { __typename ... on SessionSuccess { session { account { id } } } ... on OperationError { code message } }
    }`, { input: { email: syntheticEmail, password: syntheticPassword } }, { operationName: 'SmokeSignIn' })
    requireStatus(signIn.data.signIn?.__typename === 'SessionSuccess', `Synthetic sign-in failed: ${JSON.stringify(signIn.data)}`)
    const ownerAccountId = signIn.data.signIn.session.account.id
    const cookie = signIn.response.headers.get('set-cookie')?.split(';')[0] ?? ''
    requireStatus(Boolean(cookie), 'Synthetic sign-in cookie missing')
    const choices = await graphql(`query SmokeEntryOwnerChoices($eventId: ID!) {
      entryOwnerChoices(eventId: $eventId) { __typename
        ... on EntryOwnerChoiceListSuccess { choices { accountId isEventParticipant } }
        ... on OperationError { code message }
      }
    }`, { eventId: syntheticEventId }, { cookie, operationName: 'SmokeEntryOwnerChoices' })
    requireStatus(choices.data.entryOwnerChoices?.__typename === 'EntryOwnerChoiceListSuccess',
      `Synthetic owner lookup failed: ${JSON.stringify(choices.data)}`)
    requireStatus(!/"(email|phone|displayName)"\s*:/.test(JSON.stringify(choices.data)),
      'Synthetic smoke query requested identity fields')
    const unique = Date.now().toString(36)
    const created = await graphql(`mutation SmokeCreateEntry($input: CreateEventEntryInput!) {
      createEventEntry(input: $input) { __typename
        ... on EntryCreationSuccess { result { createdEntries { id } affectedParticipant { accountId entryCount } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, categoryId: syntheticCategoryId,
      accountId: ownerAccountId, title: `Smoke ${unique}`,
      idempotencyKey: crypto.randomUUID() } }, { cookie, operationName: 'SmokeCreateEntry' })
    requireStatus(created.data.createEventEntry?.__typename === 'EntryCreationSuccess',
      `Synthetic entry creation failed: ${JSON.stringify(created.data)}`)
    const entryId = created.data.createEventEntry.result.createdEntries[0]?.id
    const accountId = created.data.createEventEntry.result.affectedParticipant.accountId
    const projection = await graphql(`query SmokeEntryProjection($eventId: ID!) {
      ownedEvents(first: 20) { __typename
        ... on EventListSuccess { events { nodes { id categories { id entries { id } } } } }
        ... on OperationError { code message }
      }
      eventParticipants(eventId: $eventId) { __typename
        ... on ParticipantListSuccess { participants { accountId entryCount } }
        ... on OperationError { code message }
      }
    }`, { eventId: syntheticEventId }, { cookie, operationName: 'SmokeEntryProjection' })
    const projectedEvent = projection.data.ownedEvents?.events?.nodes
      ?.find((event) => event.id === syntheticEventId)
    const projectedEntries = projectedEvent?.categories
      ?.flatMap((category) => category.entries) ?? []
    requireStatus(projectedEntries.some((entry) => entry.id === entryId), 'Synthetic entry missing from category projection')
    requireStatus(projection.data.eventParticipants?.participants
      ?.some((participant) => participant.accountId === accountId), 'Synthetic owner missing from participant projection')
    const archived = await graphql(`mutation SmokeArchiveEntry($input: ArchiveEventEntryInput!) {
      archiveEventEntry(input: $input) { __typename
        ... on EntryArchiveSuccess { result { archivedEntryIds affectedParticipant { accountId entryCount } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, entryId, idempotencyKey: crypto.randomUUID() } },
    { cookie, operationName: 'SmokeArchiveEntry' })
    requireStatus(archived.data.archiveEventEntry?.__typename === 'EntryArchiveSuccess'
      && archived.data.archiveEventEntry.result.archivedEntryIds.includes(entryId),
    `Synthetic entry archive failed: ${JSON.stringify(archived.data)}`)
    const participants = await graphql(`query SmokeParticipants($eventId: ID!) {
      eventParticipants(eventId: $eventId) { __typename
        ... on ParticipantListSuccess { participants { accountId } }
        ... on OperationError { code message }
      }
    }`, { eventId: syntheticEventId }, { cookie, operationName: 'SmokeParticipants' })
    requireStatus(participants.data.eventParticipants?.__typename === 'ParticipantListSuccess'
      && !participants.data.eventParticipants.participants.some((item) => item.accountId === accountId),
      'Archived synthetic owner remained in active participant view')
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
