import { expect } from '@playwright/test'

export const ballotEnvironment = Object.freeze({
  publicId: process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID ?? '',
  codePublicId: process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID ?? '',
  codeA: process.env.E2E_VOTING_CODE_A ?? '',
  codeB: process.env.E2E_VOTING_CODE_B ?? '',
  codeC: process.env.E2E_VOTING_CODE_C ?? '',
  closedHistoryPublicId: process.env.E2E_CLOSED_BALLOT_HISTORY_PUBLIC_ID ?? '',
  historyVoterEmail: process.env.E2E_HISTORY_VOTER_EMAIL ?? '',
  historyVoterPassword: process.env.E2E_HISTORY_VOTER_PASSWORD ?? '',
})

export async function openEventBallot(page) {
  await page.goto(`/events/${ballotEnvironment.publicId}`)
  await page.getByRole('button', { name: 'Vote' }).click()
  await expect(page).toHaveURL(new RegExp(`/events/${ballotEnvironment.publicId}/vote`))
  await expect(page.getByRole('heading', { name: /vote/i })).toBeVisible()
}

export async function selectFirstAvailableChoice(page, choiceIndex = 0) {
  const categories = page.locator('.ballot-category')
  await expect(categories.first()).toBeVisible()
  for (let index = 0; index < await categories.count(); index += 1) {
    const category = categories.nth(index)
    const radios = category.getByRole('radio')
    const radio = radios.nth(Math.min(choiceIndex, Math.max(0, await radios.count() - 1)))
    if (await radio.count()) { await radio.check(); return category }
    const checkboxes = category.getByRole('checkbox')
    const checkbox = checkboxes.nth(Math.min(choiceIndex, Math.max(0, await checkboxes.count() - 1)))
    if (await checkbox.count()) { await checkbox.check(); return category }
    const rankingControl = category.getByRole('button', { name: /move .* (up|down)/i }).first()
    if (await rankingControl.count()) { await rankingControl.click(); return category }
  }
  throw new Error('Synthetic voting event has no selectable active entry')
}

export async function openBallotConfirmation(page) {
  await page.getByRole('button', { name: 'Submit vote' }).click()
  const sheet = page.getByRole('alertdialog', { name: /submit vote/i })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText(/not be able to redo your vote/i)
  return sheet
}

export async function enterVotingCode(page, code) {
  const dialog = page.getByRole('dialog', { name: /enter (a new )?voting code/i })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Voting code').fill(code)
  await dialog.getByRole('button', { name: 'Continue' }).click()
  return dialog
}

export async function openCodeBallot(page, code = ballotEnvironment.codeA) {
  await page.goto(`/events/${ballotEnvironment.codePublicId}`)
  await page.getByRole('button', { name: 'Vote' }).click()
  await enterVotingCode(page, code)
  await expect(page).toHaveURL(new RegExp(`/events/${ballotEnvironment.codePublicId}/vote`))
  await expect(page.getByRole('button', { name: 'Submit vote' })).toBeVisible()
}

export async function submitCurrentBallot(page, choiceIndex = 0) {
  const category = await selectFirstAvailableChoice(page, choiceIndex)
  const selected = category.locator('label:has(input:checked)').first()
  const selectedLabel = await selected.count() ? (await selected.textContent()).trim() : null
  const sheet = await openBallotConfirmation(page)
  await sheet.getByRole('button', { name: /confirm|submit/i }).click()
  await expect(page.getByText(/voting complete/i)).toBeVisible()
  return { selectedLabel }
}

export async function signInHistoryVoter(page) {
  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(ballotEnvironment.historyVoterEmail)
  await page.getByLabel('Password').fill(ballotEnvironment.historyVoterPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/sign-in/)
}
