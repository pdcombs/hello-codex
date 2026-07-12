import { expect, test } from '@playwright/test'
import { eventSetupData, signInHost } from './fixtures/event-setup.js'

test('CUF-001 host registers display-named participant with multiple entries', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  const data = eventSetupData(testInfo)
  await signInHost(page)
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await page.getByRole('tab', { name: 'Participants' }).click()
  await page.getByLabel('Display name').fill(data.participant.displayName)
  await page.getByLabel('Email').fill(data.participant.email)
  await page.getByLabel('Entry 1 title').fill(data.entryTitle)
  await page.getByRole('button', { name: 'Add another entry' }).click()
  await page.getByLabel('Entry 2 title').fill(`${data.entryTitle} two`)
  await page.getByRole('button', { name: 'Add participant' }).click()
  await expect(page.getByText(data.participant.displayName)).toBeVisible()
  await expect(page.getByText('2 entries')).toBeVisible()
})

test('CUF-001 participant self-registers with default-category entry', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_PARTICIPANT_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic participant and open event required')
  const data = eventSetupData(testInfo)
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_PARTICIPANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await page.getByLabel('Entry 1 title').fill(data.entryTitle)
  await page.getByRole('button', { name: 'Register for event' }).click()
  await expect(page.getByText('You are registered for this event.')).toBeVisible()
})

test('CUF-002 host adds and renames unique categories', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  const data = eventSetupData(testInfo)
  await signInHost(page)
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await page.getByLabel('New category title').fill(data.categoryTitle)
  await page.getByRole('button', { name: 'Add category' }).click()
  await expect(page.getByText(data.categoryTitle)).toBeVisible()
  await page.getByRole('button', { name: 'Rename' }).last().click()
  await page.getByLabel('Category title').fill(`${data.categoryTitle} renamed`)
  await page.getByRole('button', { name: 'Save category' }).click()
  await expect(page.getByText(`${data.categoryTitle} renamed`)).toBeVisible()
})

test('CUF-004 non-owner cannot access category management', async ({ page }) => {
  test.skip(!process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_PARTICIPANT_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic participant and open event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_PARTICIPANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('button', { name: 'Add category' })).toHaveCount(0)
})

test('CUF-003 anonymous and host views show category-grouped setup', async ({ page }) => {
  test.skip(!process.env.E2E_OPEN_EVENT_PUBLIC_ID, 'Synthetic open event required')
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByLabel('Event categories')).toBeVisible()
  await expect(page.locator('.event-category-card').first()).toBeVisible()

  if (process.env.E2E_HOST_EMAIL && process.env.E2E_HOST_PASSWORD) {
    await signInHost(page)
    await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
    await expect(page.getByRole('tab', { name: 'Setup' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByLabel('Event categories')).toBeVisible()
  }
})
