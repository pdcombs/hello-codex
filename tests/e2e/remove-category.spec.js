import { expect, test } from '@playwright/test'
import { createHostedEvent, createVerifiedHost, signInHost } from './fixtures/event-setup.js'

const eventId = process.env.E2E_OPEN_EVENT_PUBLIC_ID

async function graphql(page, query, variables, operationName) {
  return page.evaluate(async ({ query, variables, operationName }) => {
    const response = await fetch('/graphql', { method: 'POST', headers: {
      'Content-Type': 'application/json', 'X-Requested-With': 'votiy-web',
    }, body: JSON.stringify({ query, variables, operationName }) })
    return response.json()
  }, { query, variables, operationName })
}

test('host can cancel and confirm category removal', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD,
    'Synthetic host and multi-category event required')
  await signInHost(page)
  await page.goto(`/events/${eventId}`)
  const cards = page.locator('.event-category-card')
  test.skip(await cards.count() < 2, 'Synthetic event needs at least two categories')
  const card = cards.first()
  await card.getByRole('button', { name: 'Edit' }).click()
  await card.getByRole('button', { name: 'Remove category' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(/This will remove \d+ entr(?:y|ies)/)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await card.getByRole('button', { name: 'Remove category' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove category' }).click()
  await expect(card).toHaveCount(0)
})

test('non-host has no category removal control', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_PARTICIPANT_PASSWORD,
    'Synthetic participant and event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_PARTICIPANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${eventId}`)
  await expect(page.getByRole('button', { name: 'Remove category' })).toHaveCount(0)
})

test('final category is disabled in UI and rejected by direct mutation', async ({ page }, testInfo) => {
  if (process.env.E2E_HOST_EMAIL && process.env.E2E_HOST_PASSWORD) await signInHost(page)
  else await createVerifiedHost(page, testInfo, 'final-category')
  await createHostedEvent(page, `Final category ${Date.now()}`)
  const publicId = new URL(page.url()).pathname.split('/').at(-1)
  const snapshot = await graphql(page, `query FinalCategorySnapshot($publicId: String!) {
    eventByPublicId(publicId: $publicId) { ... on EventSuccess { event { id updatedAt categories { id updatedAt } } } }
  }`, { publicId }, 'FinalCategorySnapshot')
  const event = snapshot.data.eventByPublicId.event
  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('button', { name: 'Remove category' })).toBeDisabled()
  await expect(page.getByText('Every event needs at least one category.')).toBeVisible()
  const denied = await graphql(page, `mutation FinalCategoryArchive($input: ArchiveEventCategoryInput!) {
    archiveEventCategory(input: $input) { __typename ... on OperationError { code } }
  }`, { input: { eventId: event.id, categoryId: event.categories[0].id,
    expectedEventUpdatedAt: event.updatedAt, expectedCategoryUpdatedAt: event.categories[0].updatedAt,
    activeEntries: [], idempotencyKey: crypto.randomUUID() } }, 'FinalCategoryArchive')
  expect(denied.data.archiveEventCategory).toMatchObject({ __typename: 'OperationError', code: 'CONFLICT' })
})

test('concurrent removals preserve one active default category', async ({ page }, testInfo) => {
  if (process.env.E2E_HOST_EMAIL && process.env.E2E_HOST_PASSWORD) await signInHost(page)
  else await createVerifiedHost(page, testInfo, 'concurrent-category')
  await createHostedEvent(page, `Concurrent category ${Date.now()}`)
  const publicId = new URL(page.url()).pathname.split('/').at(-1)
  const initial = await graphql(page, `query ConcurrentSnapshot($publicId: String!) {
    eventByPublicId(publicId: $publicId) { ... on EventSuccess { event { id updatedAt categories { id updatedAt } } } }
  }`, { publicId }, 'ConcurrentSnapshot')
  const eventId = initial.data.eventByPublicId.event.id
  const added = await graphql(page, `mutation ConcurrentAdd($input: AddEventCategoryInput!) {
    addEventCategory(input: $input) { ... on EventSuccess { event { id updatedAt categories { id isDefault updatedAt } } } }
  }`, { input: { eventId, title: `Second ${Date.now()}`, idempotencyKey: crypto.randomUUID() } }, 'ConcurrentAdd')
  const event = added.data.addEventCategory.event
  const mutation = `mutation ConcurrentArchive($input: ArchiveEventCategoryInput!) {
    archiveEventCategory(input: $input) { __typename ... on EventSuccess { event { categories { id isDefault } } }
      ... on OperationError { code } }
  }`
  const results = await Promise.all(event.categories.map((category) => graphql(page, mutation, { input: {
    eventId, categoryId: category.id, expectedEventUpdatedAt: event.updatedAt,
    expectedCategoryUpdatedAt: category.updatedAt, activeEntries: [], idempotencyKey: crypto.randomUUID(),
  } }, 'ConcurrentArchive')))
  expect(results.filter((result) => result.data.archiveEventCategory.__typename === 'EventSuccess')).toHaveLength(1)
  const current = await graphql(page, `query ConcurrentResult($publicId: String!) {
    eventByPublicId(publicId: $publicId) { ... on EventSuccess { event { categories { id isDefault } } } }
  }`, { publicId }, 'ConcurrentResult')
  expect(current.data.eventByPublicId.event.categories).toHaveLength(1)
  expect(current.data.eventByPublicId.event.categories[0].isDefault).toBe(true)
})
