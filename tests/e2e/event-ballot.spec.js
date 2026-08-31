import { expect, test } from '@playwright/test'
import {
  ballotEnvironment,
  enterVotingCode,
  openBallotConfirmation,
  openCodeBallot,
  openEventBallot,
  selectFirstAvailableChoice,
  signInHistoryVoter,
  submitCurrentBallot,
} from './fixtures/event-ballot.js'

test('CUF-001 voter confirms ballot and reviews immutable choices', async ({ page }) => {
  test.skip(!ballotEnvironment.publicId, 'Synthetic open voting event required')
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
  test.skip(!ballotEnvironment.publicId, 'Synthetic open voting event required')
  await openEventBallot(page)
  await page.getByRole('button', { name: 'Submit vote' }).click()
  await expect(page.getByRole('alert')).toContainText(/at least one/i)
  await expect(page.getByRole('alertdialog', { name: /submit vote/i })).toHaveCount(0)

  await selectFirstAvailableChoice(page)
  await expect(await openBallotConfirmation(page)).toBeVisible()
})

test('CUF-003 cancel preserves choices and creates no completed state', async ({ page }) => {
  test.skip(!ballotEnvironment.publicId, 'Synthetic open voting event required')
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
  test.skip(!ballotEnvironment.publicId, 'Synthetic open voting event required')
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

  const sheet = page.getByRole('alertdialog', { name: /submit vote/i })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('code voter opens private paginated history after code A and code B on same device', async ({ page, browser }) => {
  test.skip(!ballotEnvironment.codePublicId || !ballotEnvironment.codeA || !ballotEnvironment.codeB,
    'Synthetic code event and two unused codes required')
  await openCodeBallot(page)
  const firstSubmission = await submitCurrentBallot(page, 0)
  const firstReview = await page.locator('.ballot-form-readonly').textContent()

  await page.reload()
  await expect(page.locator('.ballot-form-readonly')).toContainText(firstReview.trim())
  await page.getByRole('button', { name: 'Cast another vote' }).click()
  await enterVotingCode(page, ballotEnvironment.codeA)
  await expect(page.getByRole('dialog', { name: /enter a new voting code/i })).toContainText(/invalid|already used/i)
  await expect(page.locator('.ballot-form-readonly')).toContainText(firstReview.trim())

  await page.getByLabel('Voting code').fill(ballotEnvironment.codeB)
  await page.getByRole('dialog', { name: /enter a new voting code/i }).getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('button', { name: 'Submit vote' })).toBeVisible()
  await expect(page.locator('.ballot-category input:checked')).toHaveCount(0)
  const secondSubmission = await submitCurrentBallot(page, 1)
  const secondReview = await page.locator('.ballot-form-readonly').textContent()
  expect(secondReview).not.toBe('')
  await page.reload()
  await expect(page.locator('.ballot-form-readonly')).toContainText(secondReview.trim())

  await page.goto(`/events/${ballotEnvironment.codePublicId}`)
  await page.getByRole('button', { name: 'Vote' }).click()
  const codeDialog = page.getByRole('dialog', { name: /enter voting code/i })
  await expect(codeDialog.getByRole('button', { name: 'View previous votes' })).toBeVisible()
  await codeDialog.getByRole('button', { name: 'View previous votes' }).click()
  await expect(page).toHaveURL(new RegExp(`/events/${ballotEnvironment.codePublicId}/votes`))
  await expect(page.getByRole('heading', { name: /Previous votes for / })).toBeVisible()
  const history = page.locator('main article')
  await expect(history).toHaveCount(2)
  await expect(history.locator('time')).toHaveCount(2)
  if (secondSubmission.selectedLabel) await expect(history.nth(0)).toContainText(secondSubmission.selectedLabel)
  if (firstSubmission.selectedLabel) await expect(history.nth(1)).toContainText(firstSubmission.selectedLabel)
  await page.getByRole('button', { name: 'Cast another vote' }).click()
  await expect(page.getByRole('dialog', { name: /enter a new voting code/i })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  const foreignContext = await browser.newContext()
  try {
    const foreignPage = await foreignContext.newPage()
    await foreignPage.goto(`/events/${ballotEnvironment.codePublicId}/votes`)
    await expect(foreignPage.getByRole('heading', { name: /Previous votes for / })).toBeVisible()
    await expect(foreignPage.locator('main article')).toHaveCount(0)
  } finally { await foreignContext.close() }
})

test('code re-entry cancel preserves review and keyboard focus on mobile', async ({ page }) => {
  test.skip(!ballotEnvironment.codePublicId || !ballotEnvironment.codeC,
    'Synthetic code event and unused code required')
  await page.setViewportSize({ width: 390, height: 520 })
  await openCodeBallot(page, ballotEnvironment.codeC)
  await submitCurrentBallot(page)
  const review = await page.locator('.ballot-form-readonly').textContent()
  const another = page.getByRole('button', { name: 'Cast another vote' })
  await another.focus(); await page.keyboard.press('Enter')
  await expect(page.getByLabel('Voting code')).toBeFocused()
  await page.getByRole('dialog', { name: /enter a new voting code/i }).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator('.ballot-form-readonly')).toContainText(review.trim())
  await expect(another).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})

test('closed voting keeps account history private and read-only on mobile', async ({ page }) => {
  test.skip(!ballotEnvironment.closedHistoryPublicId || !ballotEnvironment.historyVoterEmail
    || !ballotEnvironment.historyVoterPassword, 'Synthetic closed history voter and event required')
  await page.setViewportSize({ width: 320, height: 640 })
  await signInHistoryVoter(page)
  await page.goto(`/events/${ballotEnvironment.closedHistoryPublicId}/votes`)
  await expect(page.getByRole('heading', { name: /Previous votes for / })).toBeVisible()
  await expect(page.locator('main article').first()).toBeVisible()
  await expect(page.getByText('Voting is closed. Previous votes remain available to review.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cast another vote' })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})
