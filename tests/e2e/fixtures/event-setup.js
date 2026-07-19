import { expect } from '@playwright/test'

export function eventSetupData(testInfo, suffix = Date.now()) {
  const id = `${suffix}-${testInfo.parallelIndex}`
  return Object.freeze({
    eventTitle: `Event setup ${id}`,
    categoryTitle: `Category ${id}`,
    participant: Object.freeze({
      displayName: `Participant ${id}`,
      email: `participant-${id}@example.test`,
      phone: '',
    }),
    entryTitle: `Entry ${id}`,
  })
}

export async function signInHost(page) {
  const email = process.env.E2E_HOST_EMAIL
  const password = process.env.E2E_HOST_PASSWORD
  if (!email || !password) throw new Error('E2E host credentials are required')

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
}

export async function createVerifiedHost(page, testInfo, prefix = 'e2e-host') {
  const email = `${prefix}-${Date.now()}-${testInfo.parallelIndex}@example.test`
  const password = 'a sufficiently long password'
  await page.goto('/register')
  await page.getByLabel('Display name').fill('E2E Host')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  const token = await page.getByLabel('Verification token').inputValue()
  await page.goto(`/verify-email?token=${encodeURIComponent(token)}`)
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()
  await page.goto('/sign-in')
  const emailInput = page.getByLabel('Email')
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign in' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
  return { email }
}

export async function createHostedEvent(page, title) {
  await page.getByRole('link', { name: 'Create event' }).first().click()
  await expect(page).toHaveURL(/\/events\/new$/)
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Create event' }).click()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}

export async function addCategory(page, title) {
  await page.getByRole('button', { name: 'Add category' }).click()
  await page.getByLabel('Category title').fill(title)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

export async function openParticipantsTab(page) {
  await page.getByRole('tab', { name: 'Participants' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Participants' })).toBeVisible()
}
