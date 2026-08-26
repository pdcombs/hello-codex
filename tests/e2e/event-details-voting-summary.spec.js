import { expect, test } from '@playwright/test'
import { expectVotingSummary, openFeature011HostEvent } from './fixtures/event-details-voting-summary.js'

test('event details host save and reload', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic Feature 011 host event required')
  await openFeature011HostEvent(page, process.env.E2E_OPEN_EVENT_PUBLIC_ID)
  const title = `Feature 011 ${Date.now()}`
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Description').fill('Editable event details')
  await page.getByLabel('Location').fill('Local test venue')
  await page.getByRole('button', { name: 'Save event details' }).click()
  await expect(page.getByText('Event details saved.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Title')).toHaveValue(title)
})

test('main event shows schedule and event-wide rule summary', async ({ page }) => {
  test.skip(!process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID, 'Synthetic open voting event required')
  await page.goto(`/events/${process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID}`)
  await expect(page.getByLabel('Voting information').locator('time')).toHaveCount(2)
  await expectVotingSummary(page, /vote/, /categor/)
})

test('private summary does not fetch or expose voting data', async ({ page }) => {
  test.skip(!process.env.E2E_PRIVATE_EVENT_PUBLIC_ID, 'Synthetic private event required')
  const capabilityRequests = []
  page.on('request', (request) => {
    if (request.postData()?.includes('EventVotingCapability')) capabilityRequests.push(request)
  })
  await page.goto(`/events/${process.env.E2E_PRIVATE_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('note')).toBeVisible()
  await expect(page.getByLabel('Voting information')).toHaveCount(0)
  expect(capabilityRequests).toHaveLength(0)
})
