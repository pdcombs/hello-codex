import { expect, test } from '@playwright/test'
import { createHostedEvent, createVerifiedHost } from './fixtures/event-setup.js'

test('CUF-001 host opens zero-vote results and sees current aggregate', async ({ page }, testInfo) => {
  test.skip(process.env.E2E_SYNTHETIC_ACCOUNTS !== 'true', 'Synthetic account creation required')
  await createVerifiedHost(page, testInfo, 'results-host')
  await createHostedEvent(page, `Results event ${Date.now()}`)
  await page.getByRole('tab', { name: 'Results' }).click()
  await expect(page.getByRole('heading', { name: 'Voting results' })).toBeVisible()
  await expect(page.getByLabel('0 votes received')).toBeVisible()
  await expect(page.getByText('No votes received yet.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Event settings' })).toBeVisible()
})

test('CUF-002 anonymous viewer cannot open host results route', async ({ page }) => {
  const publicId = process.env.E2E_RESULTS_EVENT_PUBLIC_ID
  test.skip(!publicId, 'E2E_RESULTS_EVENT_PUBLIC_ID is required')
  await page.goto(`/events/${publicId}/results`)
  await expect(page).toHaveURL(/\/sign-in/)
  await expect(page.getByRole('heading', { name: 'Voting results' })).toHaveCount(0)
})
