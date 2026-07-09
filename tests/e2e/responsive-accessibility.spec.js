import { expect, test } from '@playwright/test'

test('public shell exposes skip link and mobile-safe nav', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()

  if (isMobile) {
    await expect(page.getByRole('link', { name: 'Create your account' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  }
})

test('auth pages stay usable on desktop and mobile', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.goto('/sign-in')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
})
