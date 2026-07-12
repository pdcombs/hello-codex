import { expect, test } from '@playwright/test'
import { eventSetupData, signInHost } from './fixtures/event-setup.js'

test('CUF-001 host registers display-named participant with multiple entries', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  const data = eventSetupData(testInfo)
  await signInHost(page)
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await page.getByLabel('Display name').fill(data.participant.displayName)
  await page.getByLabel('Email').fill(data.participant.email)
  await page.getByLabel('Entry 1 title').fill(data.entryTitle)
  await page.getByRole('button', { name: 'Add another entry' }).click()
  await page.getByLabel('Entry 2 title').fill(`${data.entryTitle} two`)
  await page.getByRole('button', { name: 'Add participant' }).click()
  await expect(page.getByText(data.participant.displayName)).toBeVisible()
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
