import { expect, test } from '@playwright/test'
import { signInHost } from './fixtures/event-setup.js'

const eventId = process.env.E2E_OPEN_EVENT_PUBLIC_ID

test('owner opens the unified chooser and can dismiss it', async ({ page }) => {
  test.skip(!eventId || !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD,
    'Synthetic host and event required')
  await signInHost(page)
  await page.goto(`/events/${eventId}`)
  const add = page.getByRole('button', { name: 'Add', exact: true })
  await add.click()
  const dialog = page.getByRole('dialog', { name: 'Add to event' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Category' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Entry' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(add).toBeFocused()
})

test('public event view never exposes the unified Add control', async ({ page }) => {
  test.skip(!eventId, 'Synthetic public event required')
  await page.goto(`/events/${eventId}`)
  await expect(page.getByRole('button', { name: 'Add', exact: true })).toHaveCount(0)
})

