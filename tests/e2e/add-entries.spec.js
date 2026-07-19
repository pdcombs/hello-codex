import { expect, test } from '@playwright/test'
import { signInHost } from './fixtures/event-setup.js'

const eventId = process.env.E2E_OPEN_EVENT_PUBLIC_ID

async function openAddEntry(page) {
  await signInHost(page)
  await page.goto(`/events/${eventId}`)
  await page.getByRole('button', { name: 'Add entry' }).first().click()
  await expect(page.getByRole('dialog', { name: 'Who is this entry for?' })).toBeVisible()
}

test('CUF-001 host adds one entry for existing account', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_HOST_EMAIL
    || !process.env.E2E_HOST_PASSWORD, 'Synthetic host, event, and participant required')
  await openAddEntry(page)
  await page.getByLabel('Search by email or phone').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByRole('option', { name: new RegExp(process.env.E2E_PARTICIPANT_EMAIL, 'i') }).click()
  const title = `Existing owner ${Date.now()}`
  await page.getByLabel('Entry title').fill(title)
  await page.getByRole('button', { name: 'Save entry' }).click()
  await expect(page.getByText(title)).toBeVisible()
})

test('CUF-003 last-used participant is promoted in recent choices', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD,
    'Synthetic host and event required')
  await openAddEntry(page)
  const choices = page.getByRole('option')
  test.skip(await choices.count() === 0, 'Event needs one existing entry owner')
  const ownerName = await choices.first().locator('strong').innerText()
  await choices.first().click()
  await page.getByLabel('Entry title').fill(`Recent owner ${Date.now()}`)
  await page.getByRole('button', { name: 'Save entry' }).click()
  await page.getByRole('button', { name: 'Add entry' }).first().click()
  await expect(page.getByRole('option').first().locator('strong')).toHaveText(ownerName)
})

test('CUF-002/CUF-004 host can search globally and create provisional owner', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD
    || !process.env.E2E_UNUSED_CONTACT, 'Synthetic host, event, and unused contact required')
  await openAddEntry(page)
  const search = page.getByLabel('Search by email or phone')
  await search.fill(process.env.E2E_UNUSED_CONTACT)
  await expect(page.getByText('No matching account found.')).toBeVisible()
  await page.getByRole('button', { name: 'Create new account' }).click()
  await page.getByLabel('Display name').fill('Synthetic Entry Owner')
  await page.getByRole('button', { name: 'Use new participant' }).click()
  const title = `Provisional owner ${Date.now()}`
  await page.getByLabel('Entry title').fill(title)
  await page.getByRole('button', { name: 'Save entry' }).click()
  await expect(page.getByText(title)).toBeVisible()
})

test('CUF-005 nonmanager cannot access owner choices or entry creation', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_PARTICIPANT_PASSWORD,
    'Synthetic participant and event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_PARTICIPANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${eventId}`)
  await expect(page.getByRole('button', { name: 'Add entry' })).toHaveCount(0)
})
