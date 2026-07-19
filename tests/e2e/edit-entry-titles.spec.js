import { expect, test } from '@playwright/test'
import { signInHost } from './fixtures/event-setup.js'

const eventId = process.env.E2E_OPEN_EVENT_PUBLIC_ID

test('CUF-001/CUF-002 host edits category and multiple entry titles with one save', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD,
    'Synthetic host and populated event required')
  await signInHost(page)
  await page.goto(`/events/${eventId}`)
  const category = page.locator('.event-category-card').filter({ has: page.locator('.event-entry-row') }).first()
  test.skip(await category.count() === 0, 'Synthetic event needs active entries')
  await category.getByRole('button', { name: 'Edit' }).click()
  const entryTitles = category.getByLabel(/^Entry title for /)
  test.skip(await entryTitles.count() < 2, 'Synthetic category needs two entries')
  const first = `Edited ${Date.now()}`
  const second = `Edited ${Date.now() + 1}`
  await entryTitles.nth(0).fill(first)
  await entryTitles.nth(1).fill(second)
  await category.getByLabel('Category title').fill(`Edited category ${Date.now()}`)
  await category.getByRole('button', { name: 'Save' }).click()
  await expect(category.getByText(first)).toBeVisible()
  await expect(category.getByText(second)).toBeVisible()
})

test('CUF-003 invalid title stays editable with field feedback', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD,
    'Synthetic host and populated event required')
  await signInHost(page)
  await page.goto(`/events/${eventId}`)
  const category = page.locator('.event-category-card').filter({ has: page.locator('.event-entry-row') }).first()
  await category.getByRole('button', { name: 'Edit' }).click()
  const title = category.getByLabel(/^Entry title for /).first()
  await title.fill('')
  await category.getByRole('button', { name: 'Save' }).click()
  await expect(category.getByText('Enter an entry title.')).toBeVisible()
  await expect(title).toHaveAttribute('aria-invalid', 'true')
})

test('CUF-005 non-host cannot edit category entries', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_PARTICIPANT_EMAIL || !process.env.E2E_PARTICIPANT_PASSWORD,
    'Synthetic participant and event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_PARTICIPANT_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_PARTICIPANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${eventId}`)
  await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)
})
