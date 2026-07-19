const origin = process.env.PRODUCTION_ORIGIN
const publicEventPath = process.env.PRODUCTION_PUBLIC_EVENT_PATH ?? ''
const expectedCommit = process.env.PRODUCTION_EXPECTED_COMMIT ?? ''
const syntheticEmail = process.env.PRODUCTION_SYNTHETIC_HOST_EMAIL ?? ''
const syntheticPassword = process.env.PRODUCTION_SYNTHETIC_HOST_PASSWORD ?? ''
const syntheticEventId = process.env.PRODUCTION_SYNTHETIC_EVENT_ID ?? ''
const syntheticCategoryId = process.env.PRODUCTION_SYNTHETIC_CATEGORY_ID ?? ''
const auditMongoUri = process.env.PRODUCTION_SMOKE_MONGODB_URI ?? ''
const auditMongoDatabase = process.env.PRODUCTION_SMOKE_MONGODB_DATABASE ?? 'votiy'
const votingTimings = []
const smokeStartedAt = new Date()

if (!origin) throw new Error('PRODUCTION_ORIGIN is required')

async function fetchText(path) {
  const response = await fetch(`${origin}${path}`)
  return { response, body: await response.text() }
}

async function graphql(query, variables, { cookie = '', operationName = 'SmokeEventSetup' } = {}) {
  const startedAt = performance.now()
  const response = await fetch(`${origin}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'votiy-web', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ query, variables, operationName }),
  })
  const payload = await response.json()
  requireStatus(response.ok && !payload.errors, `Setup GraphQL failed: status=${response.status} body=${JSON.stringify(payload)}`)
  const durationMs = performance.now() - startedAt
  if (/Voting|Ballot|Code/.test(operationName)) votingTimings.push(durationMs)
  requireStatus(durationMs < Number(process.env.VOTING_P95_BUDGET_MS ?? 2000),
    `${operationName} exceeded voting latency budget`)
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
        ... on EventListSuccess { events { nodes { id updatedAt voting { rules { version } }
          categories { id title updatedAt entries { id title updatedAt } } } } }
        ... on OperationError { code message }
      }
      eventParticipants(eventId: $eventId) { __typename
        ... on ParticipantListSuccess { participants { accountId entryCount entries { id title } } }
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
    const category = projectedEvent.categories.find((item) => item.id === syntheticCategoryId)
    requireStatus(Boolean(category), 'Synthetic category missing from projection')
    const originalEntry = category.entries.find((entry) => entry.id === entryId)

    const opensAt = new Date(Date.now() - 60_000).toISOString()
    const closesAt = new Date(Date.now() + 600_000).toISOString()
    const configured = await graphql(`mutation SmokeConfigureVoting($input: UpdateEventVotingRulesInput!) {
      updateEventVotingRules(input: $input) { __typename
        ... on EventSuccess { event { id updatedAt voting { rules { version } } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, expectedEventUpdatedAt: projectedEvent.updatedAt,
      expectedRulesVersion: projectedEvent.voting.rules.version, opensAt, closesAt, accessPolicy: 'CODE',
      unrestrictedRepeatPolicy: null, maximumBallotsPerAccount: null, codeRequiresCompletedAccount: false,
      defaultCategoryRule: { categoryId: null, method: 'SINGLE', minimumSelections: null, maximumSelections: null },
      categoryRules: [], idempotencyKey: crypto.randomUUID() } }, { cookie, operationName: 'SmokeConfigureVoting' })
    requireStatus(configured.data.updateEventVotingRules?.__typename === 'EventSuccess',
      `Synthetic voting configuration failed: ${JSON.stringify(configured.data)}`)
    const rulesVersion = configured.data.updateEventVotingRules.event.voting.rules.version
    const generatedCodes = await graphql(`mutation SmokeGenerateCode($input: GenerateVotingCodesInput!) {
      generateVotingCodes(input: $input) { __typename
        ... on VotingCodeGenerationSuccess { codes { id code status } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, quantity: 1, idempotencyKey: crypto.randomUUID() } },
    { cookie, operationName: 'SmokeGenerateCode' })
    requireStatus(generatedCodes.data.generateVotingCodes?.__typename === 'VotingCodeGenerationSuccess',
      `Synthetic code generation failed: ${JSON.stringify(generatedCodes.data)}`)
    const votingCode = generatedCodes.data.generateVotingCodes.codes[0]
    const categoryBallots = projectedEvent.categories.filter((item) => item.entries.length > 0)
      .map((item) => ({ categoryId: item.id, entryIds: [item.entries[0].id] }))
    const ballotInput = { eventId: syntheticEventId, expectedRulesVersion: rulesVersion, accessCode: votingCode.code,
      provisionalVoter: { email: `smoke-voter-${unique}@example.test`, phone: null }, categoryBallots,
      idempotencyKey: crypto.randomUUID() }
    const ballot = await graphql(`mutation SmokeSubmitBallot($input: SubmitEventBallotInput!) {
      submitEventBallot(input: $input) { __typename
        ... on BallotSubmissionSuccess { receipt { id rulesVersion } }
        ... on OperationError { code message }
      }
    }`, { input: ballotInput }, { operationName: 'SmokeSubmitBallot' })
    requireStatus(ballot.data.submitEventBallot?.__typename === 'BallotSubmissionSuccess',
      `Synthetic ballot failed: ${JSON.stringify(ballot.data)}`)
    const reused = await graphql(`mutation SmokeReuseCode($input: SubmitEventBallotInput!) {
      submitEventBallot(input: $input) { __typename ... on OperationError { code message } }
    }`, { input: { ...ballotInput, idempotencyKey: crypto.randomUUID(),
      provisionalVoter: { email: `smoke-reuse-${unique}@example.test`, phone: null } } },
    { operationName: 'SmokeReuseCode' })
    requireStatus(reused.data.submitEventBallot?.__typename === 'OperationError'
      && reused.data.submitEventBallot.code === 'INVALID_ACCESS_CODE', 'Synthetic voting code reuse was not denied')
    const inventory = await graphql(`query SmokeVotingInventory($eventId: ID!) {
      eventVotingCodes(eventId: $eventId, first: 100) { __typename
        ... on VotingCodeListSuccess { codes { nodes { id status claimantAccountId } } }
        ... on OperationError { code message }
      }
    }`, { eventId: syntheticEventId }, { cookie, operationName: 'SmokeVotingInventory' })
    requireStatus(inventory.data.eventVotingCodes?.codes?.nodes
      ?.some((item) => item.id === votingCode.id && item.status === 'USED' && item.claimantAccountId),
    'Synthetic code inventory did not report the consumed claim')
    if (auditMongoUri) {
      const { MongoClient } = await import('../../votiy-api/node_modules/mongodb/lib/index.js')
      const client = new MongoClient(auditMongoUri)
      try {
        await client.connect()
        const names = await client.db(auditMongoDatabase).collection('auditEvents').distinct('name', {
          name: { $in: ['voting.codes_generated', 'voting.code_consumed', 'voting.ballot_submitted'] },
          createdAt: { $gte: smokeStartedAt },
        })
        requireStatus(names.length === 3, `Voting audit smoke incomplete: ${names.join(',')}`)
      } finally { await client.close() }
    }
    const editedTitle = `Smoke edited ${unique}`
    const editInput = { eventId: syntheticEventId, categoryId: syntheticCategoryId, title: category.title,
      expectedCategoryUpdatedAt: category.updatedAt,
      entryTitles: category.entries.map((entry) => ({ entryId: entry.id,
        title: entry.id === entryId ? editedTitle : entry.title, expectedUpdatedAt: entry.updatedAt })),
      idempotencyKey: crypto.randomUUID() }
    const edited = await graphql(`mutation SmokeUpdateCategory($input: UpdateEventCategoryInput!) {
      updateEventCategory(input: $input) { __typename
        ... on EventSuccess { event { categories { id title updatedAt entries { id title updatedAt } } } }
        ... on OperationError { code message }
      }
    }`, { input: editInput }, { cookie, operationName: 'SmokeUpdateCategory' })
    requireStatus(edited.data.updateEventCategory?.__typename === 'EventSuccess',
      `Synthetic title edit failed: ${JSON.stringify(edited.data)}`)
    const editedCategory = edited.data.updateEventCategory.event.categories.find((item) => item.id === syntheticCategoryId)
    requireStatus(editedCategory.entries.some((entry) => entry.id === entryId && entry.title === editedTitle),
      'Synthetic title missing from category projection')
    const editedParticipants = await graphql(`query SmokeEditedParticipants($eventId: ID!) {
      eventParticipants(eventId: $eventId) { __typename
        ... on ParticipantListSuccess { participants { entries { id title } } }
        ... on OperationError { code message }
      }
    }`, { eventId: syntheticEventId }, { cookie, operationName: 'SmokeEditedParticipants' })
    requireStatus(editedParticipants.data.eventParticipants?.participants
      ?.some((participant) => participant.entries.some((entry) => entry.id === entryId && entry.title === editedTitle)),
    'Synthetic title missing from participant projection')
    const restored = await graphql(`mutation SmokeRestoreCategory($input: UpdateEventCategoryInput!) {
      updateEventCategory(input: $input) { __typename ... on EventSuccess { event { id } }
        ... on OperationError { code message } }
    }`, { input: { ...editInput, expectedCategoryUpdatedAt: editedCategory.updatedAt,
      entryTitles: editedCategory.entries.map((entry) => ({ entryId: entry.id,
        title: entry.id === entryId ? originalEntry.title : entry.title, expectedUpdatedAt: entry.updatedAt })),
      idempotencyKey: crypto.randomUUID() } }, { cookie, operationName: 'SmokeRestoreCategory' })
    requireStatus(restored.data.updateEventCategory?.__typename === 'EventSuccess',
      `Synthetic title restoration failed: ${JSON.stringify(restored.data)}`)
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

    const categoryTitle = `Smoke category ${unique}`
    const addedCategory = await graphql(`mutation SmokeAddCategory($input: AddEventCategoryInput!) {
      addEventCategory(input: $input) { __typename
        ... on EventSuccess { event { id updatedAt categories { id title isDefault updatedAt entries { id updatedAt } } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, title: categoryTitle, idempotencyKey: crypto.randomUUID() } },
    { cookie, operationName: 'SmokeAddCategory' })
    requireStatus(addedCategory.data.addEventCategory?.__typename === 'EventSuccess',
      `Synthetic category creation failed: ${JSON.stringify(addedCategory.data)}`)
    const categoryEvent = addedCategory.data.addEventCategory.event
    const syntheticCategory = categoryEvent.categories.find((item) => item.title === categoryTitle)
    requireStatus(Boolean(syntheticCategory), 'Synthetic category missing after creation')
    requireStatus(categoryEvent.categories.length > 1, 'Synthetic event must retain another active category')

    const categoryEntry = await graphql(`mutation SmokeCreateCategoryEntry($input: CreateEventEntryInput!) {
      createEventEntry(input: $input) { __typename
        ... on EntryCreationSuccess { result { createdEntries { id updatedAt } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, categoryId: syntheticCategory.id,
      accountId: ownerAccountId, title: `Smoke category entry ${unique}`, idempotencyKey: crypto.randomUUID() } },
    { cookie, operationName: 'SmokeCreateCategoryEntry' })
    requireStatus(categoryEntry.data.createEventEntry?.__typename === 'EntryCreationSuccess',
      `Synthetic category entry creation failed: ${JSON.stringify(categoryEntry.data)}`)
    const categoryEntrySnapshot = categoryEntry.data.createEventEntry.result.createdEntries[0]

    const beforeArchive = await graphql(`query SmokeCategorySnapshot {
      ownedEvents(first: 100) { __typename
        ... on EventListSuccess { events { nodes { id updatedAt categories { id title isDefault updatedAt entries { id updatedAt } } } } }
        ... on OperationError { code message }
      }
    }`, {},
    { cookie, operationName: 'SmokeCategorySnapshot' })
    const archiveEvent = beforeArchive.data.ownedEvents?.events?.nodes?.find((item) => item.id === syntheticEventId)
    const archiveCategory = archiveEvent?.categories.find((item) => item.id === syntheticCategory.id)
    requireStatus(Boolean(archiveCategory), 'Synthetic category snapshot missing')
    const categoryArchived = await graphql(`mutation SmokeArchiveCategory($input: ArchiveEventCategoryInput!) {
      archiveEventCategory(input: $input) { __typename
        ... on EventSuccess { event { id categories { id isDefault entries { id } } } }
        ... on OperationError { code message }
      }
    }`, { input: { eventId: syntheticEventId, categoryId: archiveCategory.id,
      expectedEventUpdatedAt: archiveEvent.updatedAt, expectedCategoryUpdatedAt: archiveCategory.updatedAt,
      activeEntries: [{ entryId: categoryEntrySnapshot.id, expectedUpdatedAt: categoryEntrySnapshot.updatedAt }],
      idempotencyKey: crypto.randomUUID() } }, { cookie, operationName: 'SmokeArchiveCategory' })
    requireStatus(categoryArchived.data.archiveEventCategory?.__typename === 'EventSuccess',
      `Synthetic category archive failed: ${JSON.stringify(categoryArchived.data)}`)
    const activeCategories = categoryArchived.data.archiveEventCategory.event.categories
    requireStatus(!activeCategories.some((item) => item.id === archiveCategory.id),
      'Archived synthetic category remained in active projection')
    requireStatus(!activeCategories.flatMap((item) => item.entries).some((item) => item.id === categoryEntrySnapshot.id),
      'Category-archived entry remained in active projection')
    requireStatus(activeCategories.length >= 1 && activeCategories.filter((item) => item.isDefault).length === 1,
      'Category archive violated the active default invariant')
  }

  const deployedCommit = health.response.headers.get('x-app-commit') ?? ready.response.headers.get('x-app-commit')
  if (expectedCommit) {
    requireStatus(Boolean(deployedCommit), `Commit header missing. expected=${expectedCommit}`)
    requireStatus(deployedCommit === expectedCommit, `Commit mismatch. expected=${expectedCommit} actual=${deployedCommit}`)
  }

  const sorted = [...votingTimings].sort((left, right) => left - right)
  const votingP95Ms = sorted.length ? sorted[Math.ceil(sorted.length * 0.95) - 1] : 0
  console.log(JSON.stringify({ event: 'production_smoke.completed', outcome: 'success',
    votingP95Ms: Math.round(votingP95Ms), votingOperationCount: sorted.length,
    errorRateAlertPercent: Number(process.env.VOTING_ERROR_RATE_ALERT_PERCENT ?? 5) }))
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'production_smoke.completed', outcome: 'failure',
    alert: 'voting_smoke_or_invariant_failure', diagnostic: error.message }))
  process.exitCode = 1
})
