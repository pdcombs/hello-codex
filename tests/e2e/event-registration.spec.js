import { expect, test } from '@playwright/test'

test('CUF-003 direct-link viewing, open self-registration, and host participant management', async ({ page }) => {
  test.skip(
    !process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host credentials and open-event public id required',
  )

  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('heading')).toBeVisible()

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('heading')).toBeVisible()

  await page.getByRole('tab', { name: 'Participants' }).click()
  await page.getByLabel('Display name').fill('Test Participant')
  await page.getByLabel('Email').fill(`participant-${Date.now()}@example.test`)
  await page.getByLabel('Entry 1 title').fill('Test entry')
  await page.getByRole('button', { name: 'Add participant' }).click()
  await expect(page.getByText(/provisional account/i)).toBeVisible()
})
