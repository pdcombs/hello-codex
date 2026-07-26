import { expect, test } from '@playwright/test'

test('private non-host view exposes summary and notice only', async ({ page }) => {
  test.skip(!process.env.E2E_PRIVATE_EVENT_PUBLIC_ID, 'Private event fixture is required')
  await page.goto(`/events/${process.env.E2E_PRIVATE_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('note')).toContainText('private event')
  await expect(page.getByRole('navigation', { name: 'Event sections' })).toBeVisible()
  await expect(page.getByRole('button', { name: /vote|add|edit|remove/i })).toHaveCount(0)
})
