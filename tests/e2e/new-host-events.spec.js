import { expect, test } from '@playwright/test'

test('CUF-001 host creates open and admin-managed events that persist across navigation', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD, 'Synthetic host credentials required')

  const titleBase = `Host event ${Date.now()}`

  await page.goto('/sign-in')
  await page.getByLabel('Email').fill(process.env.E2E_HOST_EMAIL)
  await page.getByLabel('Password').fill(process.env.E2E_HOST_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.getByRole('link', { name: 'Create event' }).click()
  await page.getByLabel('Title').fill(`${titleBase} admin`)
  await page.getByRole('button', { name: 'Create event' }).click()
  await expect(page.getByRole('heading', { name: `${titleBase} admin` })).toBeVisible()

  await page.goto('/events/new')
  await page.getByLabel('Title').fill(`${titleBase} open`)
  await page.getByLabel('Registration policy').selectOption('OPEN')
  await page.getByRole('button', { name: 'Create event' }).click()
  await expect(page.getByRole('heading', { name: `${titleBase} open` })).toBeVisible()

  await page.goto('/')
  await expect(page.getByRole('link', { name: `${titleBase} admin` })).toBeVisible()
  await expect(page.getByRole('link', { name: `${titleBase} open` })).toBeVisible()
})
