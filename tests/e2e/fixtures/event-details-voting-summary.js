import { expect } from '@playwright/test'
import { signInHost } from './event-setup.js'

export async function openFeature011HostEvent(page, publicId) {
  await signInHost(page)
  await page.goto(`/events/${publicId}/settings`)
  await expect(page.getByRole('heading', { name: 'Event details' })).toBeVisible()
}

export async function expectVotingSummary(page, accessText, methodText) {
  const summary = page.getByLabel('Voting information')
  await expect(summary).toContainText(accessText)
  await expect(summary).toContainText(methodText)
}
