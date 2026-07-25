import { expect, test } from '@playwright/test'

test('public event workspace remains responsive and owner controls stay private', async ({ page }) => {
  const path = process.env.E2E_PUBLIC_EVENT_PATH
  test.skip(!path, 'E2E_PUBLIC_EVENT_PATH is required for workspace navigation')
  const startedAt = Date.now()
  await page.goto(path)
  await expect(page.getByLabel('Event analytics')).toBeVisible()
  expect(Date.now() - startedAt).toBeLessThan(2000)
  await expect(page.getByRole('link', { name: 'Event settings' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /add entry/i })).toHaveCount(0)
})
