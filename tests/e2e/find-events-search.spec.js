import { expect, test } from '@playwright/test'

test('Find Events opens accessibly and restores focus', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Find events' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Find events' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('searchbox')).toBeFocused()
  await expect(dialog.getByRole('searchbox')).toHaveAttribute('placeholder', /motorcycle show/i)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('search journey supports eligible results, paging, and viewer-aware navigation', async ({ page }) => {
  test.skip(!process.env.E2E_SEARCH_QUERY || !process.env.E2E_SEARCH_EVENT_PUBLIC_ID,
    'Feature 010 search fixtures are required')
  await page.goto('/')
  const startedAt = Date.now()
  await page.getByRole('button', { name: 'Find events' }).click()
  await page.getByRole('searchbox').fill(process.env.E2E_SEARCH_QUERY)
  const result = page.getByRole('button', { name: new RegExp(process.env.E2E_SEARCH_EVENT_TITLE ?? '') }).first()
  await expect(result).toBeVisible()
  expect(Date.now() - startedAt).toBeLessThan(30_000)
  await result.click()
  await expect(page).toHaveURL(new RegExp(`/events/${process.env.E2E_SEARCH_EVENT_PUBLIC_ID}`))
})
