import { expect, test } from '@playwright/test'

test('CUF-002 returning host signs in, sees events area, and signs out', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD, 'Synthetic host credentials required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()
})
