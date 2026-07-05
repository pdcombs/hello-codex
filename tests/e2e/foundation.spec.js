import { expect, test } from '@playwright/test'

test('public Votiy shell and API health are available', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
  const health = await request.get('/health')
  expect(health.ok()).toBe(true)
})
