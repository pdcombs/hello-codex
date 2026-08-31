import { expect } from '@playwright/test'

export const ballotEnvironment = Object.freeze({
  publicId: process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID ?? '',
})

export async function openEventBallot(page) {
  await page.goto(`/events/${ballotEnvironment.publicId}`)
  await page.getByRole('button', { name: 'Vote' }).click()
  await expect(page).toHaveURL(new RegExp(`/events/${ballotEnvironment.publicId}/vote`))
  await expect(page.getByRole('heading', { name: /vote/i })).toBeVisible()
}

export async function selectFirstAvailableChoice(page) {
  const categories = page.locator('.ballot-category')
  await expect(categories.first()).toBeVisible()
  for (let index = 0; index < await categories.count(); index += 1) {
    const category = categories.nth(index)
    const radio = category.getByRole('radio').first()
    if (await radio.count()) { await radio.check(); return category }
    const checkbox = category.getByRole('checkbox').first()
    if (await checkbox.count()) { await checkbox.check(); return category }
    const rankingControl = category.getByRole('button', { name: /move .* (up|down)/i }).first()
    if (await rankingControl.count()) { await rankingControl.click(); return category }
  }
  throw new Error('Synthetic voting event has no selectable active entry')
}

export async function openBallotConfirmation(page) {
  await page.getByRole('button', { name: 'Submit vote' }).click()
  const sheet = page.getByRole('dialog', { name: /submit vote/i })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText(/not be able to redo your vote/i)
  return sheet
}
