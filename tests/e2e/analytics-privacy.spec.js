import { expect, test } from '@playwright/test'

test('local privacy controls work without loading production analytics', async ({ page }) => {
  await page.goto('/')
  const preferences = page.getByRole('dialog', { name: 'Cookie preferences' })
  await expect(preferences).toBeVisible()
  await preferences.getByRole('button', { name: 'Decline' }).click()
  await expect(preferences).toBeHidden()
  await expect(page.locator('script[data-votiy-analytics="true"]')).toHaveCount(0)

  await page.getByRole('link', { name: 'Privacy', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Privacy notice' })).toBeVisible()
  await page.getByRole('button', { name: 'Analytics preferences' }).click()
  await expect(preferences).toBeVisible()
  await preferences.getByRole('button', { name: 'Accept' }).click()
  await expect(preferences).toBeHidden()
  await expect(page.locator('script[data-votiy-analytics="true"]')).toHaveCount(0)
})
