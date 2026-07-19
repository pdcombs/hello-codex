import { expect, test } from '@playwright/test'
import { addCategory, createHostedEvent, createVerifiedHost, signInHost } from './fixtures/event-setup.js'

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

test('category entry-title editor remains keyboard and viewport safe', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and populated event required')
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  const category = page.locator('.event-category-card').filter({ has: page.locator('.event-entry-row') }).first()
  test.skip(await category.count() === 0, 'Synthetic event needs an active entry')
  await category.getByRole('button', { name: 'Edit' }).focus()
  await page.keyboard.press('Enter')
  await expect(category.getByLabel('Category title')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(category.getByLabel(/^Entry title for /).first()).toBeFocused()
  const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(fitsViewport).toBe(true)
})

test('category removal warning is keyboard, reduced-motion, and short-viewport safe', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 520 })
  if (process.env.E2E_HOST_EMAIL && process.env.E2E_HOST_PASSWORD && process.env.E2E_OPEN_EVENT_PUBLIC_ID) {
    await signInHost(page)
    await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  } else {
    await createVerifiedHost(page, testInfo, 'responsive-category')
    await createHostedEvent(page, `Responsive category ${Date.now()}`)
    await addCategory(page, `Second category ${Date.now()}`)
  }
  const cards = page.locator('.event-category-card')
  test.skip(await cards.count() < 2, 'Synthetic event needs two active categories')
  const trigger = cards.first().getByRole('button', { name: 'Edit' })
  await trigger.click()
  const remove = cards.first().getByRole('button', { name: 'Remove category' })
  await remove.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await expect(dialog).toContainText(/This will remove \d+ entr(?:y|ies)/)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(remove).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('voting rules and code inventory are keyboard and short-viewport safe', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID,
    'Synthetic host and code event required')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 520 })
  await signInHost(page); await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('heading', { name: 'Voting rules' })).toBeVisible()
  await page.getByLabel('Voting opens').focus(); await expect(page.getByLabel('Voting opens')).toBeFocused()
  await page.getByLabel('Number of codes').focus(); await expect(page.getByLabel('Number of codes')).toBeFocused()
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Generate codes' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('ballot controls expose labels, announced errors, and no narrow overflow', async ({ page }) => {
  test.skip(!process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID, 'Synthetic code event required')
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width: 390, height: 520 })
  await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  const code = page.getByLabel('Voting code'); await code.focus(); await expect(code).toBeFocused()
  await code.fill('bad'); await page.getByRole('button', { name: 'Submit ballot' }).click()
  await expect(code).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})
