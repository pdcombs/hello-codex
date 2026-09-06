import { expect, test } from '@playwright/test'
import { signInHost } from './fixtures/event-setup.js'

test('CUF-001 host downloads QR for saved production short URL', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  await signInHost(page)
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}/settings`)

  const qr = page.locator('canvas[title^="QR code for https://www.votiy.com/"]')
  await expect(qr).toBeVisible()
  const destination = (await qr.getAttribute('title')).replace('QR code for ', '')
  await expect(page.getByText(destination, { exact: true })).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download QR Code' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^votiy-[a-zA-Z0-9_-]+-qr\.png$/)
})
