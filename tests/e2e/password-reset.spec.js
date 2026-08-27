import { expect, test } from '@playwright/test'

test('forgot-password request stays neutral for unknown email', async ({ page }) => {
  await page.goto('/sign-in'); await page.getByRole('link', { name: 'Forgot password?' }).click()
  await page.getByLabel('Email').fill(`unknown-${Date.now()}@example.invalid`)
  await page.getByRole('button', { name: 'Send reset instructions' }).click()
  await expect(page.getByRole('status')).toContainText('If this account is eligible')
})

test('configured bypass account completes reset', async ({ page }) => {
  test.skip(!process.env.E2E_RESET_BYPASS_EMAIL, 'Synthetic bypass account required')
  await page.goto('/forgot-password'); await page.getByLabel('Email').fill(process.env.E2E_RESET_BYPASS_EMAIL)
  await page.getByRole('button', { name: 'Send reset instructions' }).click()
  await expect(page).toHaveURL(/\/reset-password\?token=/)
  await expect(page.getByText(process.env.E2E_RESET_BYPASS_EMAIL)).toBeVisible()
  const password = `Reset-${Date.now()}-password`
  await page.getByLabel('New password').fill(password); await page.getByLabel('Confirm new password').fill(password)
  await page.getByRole('button', { name: 'Reset password' }).click()
  await expect(page).toHaveURL(/\/sign-in$/); await expect(page.getByRole('status')).toContainText('Password reset')
})

test('invalid reset token fails closed', async ({ page }) => {
  await page.goto('/reset-password?token=invalid-token-value-123')
  await expect(page.getByRole('alert')).toContainText('invalid or expired')
  await expect(page.getByRole('link', { name: 'Request another reset' })).toBeVisible()
})
