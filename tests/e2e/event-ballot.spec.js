import { expect, test } from '@playwright/test'
import {
  ballotEnvironment,
  openBallotConfirmation,
  openEventBallot,
  selectFirstAvailableChoice,
} from './fixtures/event-ballot.js'

test.beforeEach(() => {
  test.skip(!ballotEnvironment.publicId, 'Synthetic open voting event required')
})

test('CUF-001 voter confirms ballot and reviews immutable choices', async ({ page }) => {
  await openEventBallot(page)
  const selectedCategory = await selectFirstAvailableChoice(page)
  const selectedInputLabel = selectedCategory.locator('label:has(input:checked)').first()
  const selectedLabel = await selectedInputLabel.count() ? (await selectedInputLabel.textContent()).trim() : null
  const categoryTitle = (await selectedCategory.locator('legend').textContent()).trim()
  const sheet = await openBallotConfirmation(page)
  await sheet.getByRole('button', { name: /confirm|submit/i }).click()

  await expect(page.getByText(/voting complete/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit vote' })).toHaveCount(0)
  await expect(page.locator('.ballot-category')).toContainText(categoryTitle)
  if (selectedLabel) await expect(page.locator('.ballot-category')).toContainText(selectedLabel)
  await expect(page.locator('.ballot-category input:not([disabled])')).toHaveCount(0)

  await page.reload()
  await expect(page.getByText(/voting complete/i)).toBeVisible()
  await expect(page.locator('.ballot-category')).toContainText(categoryTitle)
  if (selectedLabel) await expect(page.locator('.ballot-category')).toContainText(selectedLabel)
})

test('CUF-002 voter may skip categories but must choose something', async ({ page }) => {
  await openEventBallot(page)
  await page.getByRole('button', { name: 'Submit vote' }).click()
  await expect(page.getByRole('alert')).toContainText(/at least one/i)
  await expect(page.getByRole('dialog', { name: /submit vote/i })).toHaveCount(0)

  await selectFirstAvailableChoice(page)
  await expect(await openBallotConfirmation(page)).toBeVisible()
})

test('CUF-003 cancel preserves choices and creates no completed state', async ({ page }) => {
  await openEventBallot(page)
  await selectFirstAvailableChoice(page)
  const checked = page.locator('.ballot-category input:checked').first()
  const sheet = await openBallotConfirmation(page)
  await sheet.getByRole('button', { name: 'Cancel' }).click()

  await expect(sheet).toBeHidden()
  await expect(checked).toBeChecked()
  await expect(page.getByText(/voting complete/i)).toHaveCount(0)
})

test('CUF-005 sticky submit and confirmation remain keyboard/mobile usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openEventBallot(page)
  await selectFirstAvailableChoice(page)

  const submit = page.getByRole('button', { name: 'Submit vote' })
  await submit.focus()
  await expect(submit).toBeFocused()
  const box = await submit.boundingBox()
  expect(box.y + box.height).toBeLessThanOrEqual(520)
  await page.keyboard.press('Enter')

  const sheet = page.getByRole('dialog', { name: /submit vote/i })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})
