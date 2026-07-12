import { expect, test } from '@playwright/test'

test('public event never exposes participant management or email', async ({ page }) => {
  const publicPath = process.env.E2E_OPEN_EVENT_PUBLIC_PATH
  test.skip(!publicPath, 'E2E_OPEN_EVENT_PUBLIC_PATH is not configured')
  await page.goto(publicPath)
  await expect(page.getByRole('button', { name: 'Remove participant' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remove entry' })).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('@example.test')
})

test('host participant cards expose entry-derived identity and counts', async ({ page }) => {
  const eventPath = process.env.E2E_HOST_EVENT_PATH
  const storageState = process.env.E2E_HOST_STORAGE_STATE
  test.skip(!eventPath || !storageState, 'Host E2E credentials are not configured')
  await page.goto(eventPath)
  await page.getByRole('tab', { name: 'Participants' }).click()
  await expect(page.getByRole('list', { name: 'Participants' })).toBeVisible()
  await expect(page.locator('.participant-card').first()).toBeVisible()
  await expect(page.locator('.participant-entry-count').first()).toHaveAttribute('aria-label', /\d+ entries/)
})
