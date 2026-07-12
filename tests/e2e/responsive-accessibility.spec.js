import { expect, test } from '@playwright/test'

test('public shell exposes skip link and mobile-safe nav', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Voting events without the spreadsheet chaos.' })).toBeVisible()

  if (isMobile) {
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' })
    await expect(page.getByRole('link', { name: 'Create your account' })).toBeVisible()
    await expect(navigation.getByRole('link', { name: 'Sign in' })).toBeVisible()
  }
})

test('auth pages stay usable on desktop and mobile', async ({ page }) => {
  await page.goto('/register')
  await expect(page.getByLabel('Display name')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()

  await page.goto('/sign-in')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
})

test('responsive event setup supports keyboard focus, labels, errors, and mobile layout', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)

  const setupTab = page.getByRole('tab', { name: 'Setup' })
  await setupTab.focus()
  await expect(setupTab).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tab', { name: 'Participants' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('tabpanel', { name: 'Participants' })).toBeVisible()
  await expect(page.getByLabel('Display name')).toBeVisible()
  await expect(page.getByLabel('Entry 1 title')).toBeVisible()
  await page.getByRole('button', { name: 'Add participant' }).click()
  await expect(page.getByRole('alert')).toContainText('Email')
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')

  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(fitsViewport).toBe(true)
})
