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

test('responsive add-entry dialog supports keyboard focus, errors, and mobile layout', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)

  const trigger = page.getByRole('button', { name: 'Add entry' }).first()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Who is this entry for?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Search by email or phone')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(fitsViewport).toBe(true)
})
