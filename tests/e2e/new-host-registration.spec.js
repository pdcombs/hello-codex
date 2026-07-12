import { expect, test } from '@playwright/test'

const MAILPIT_ORIGIN = process.env.MAILPIT_ORIGIN ?? 'http://127.0.0.1:8025'

async function clearMailpit(request) {
  const response = await request.delete(`${MAILPIT_ORIGIN}/api/v1/messages`)
  expect(response.ok()).toBe(true)
}

async function findVerificationMessage(request, email) {
  const response = await request.get(`${MAILPIT_ORIGIN}/api/v1/messages`)
  if (!response.ok()) return null
  const payload = await response.json()
  const summary = payload.messages?.find((message) =>
    message.To?.some(({ Address }) => Address.toLowerCase() === email.toLowerCase()),
  )
  if (!summary) return null

  const detail = await request.get(`${MAILPIT_ORIGIN}/api/v1/message/${summary.ID}`)
  return detail.ok() ? detail.json() : null
}

function verificationUrl(message) {
  const body = `${message.Text ?? ''}\n${message.HTML ?? ''}`
  const match = body.match(/https?:\/\/[^\s"'<>]+\/verify-email\?token=[A-Za-z0-9_-]+/)
  if (!match) throw new Error('Verification email did not contain a verification URL')
  return match[0].replaceAll('&amp;', '&')
}

test('CUF-001 visitor registers, verifies through Mailpit, and reaches an empty hosted-events dashboard', async ({
  page,
  request,
}, testInfo) => {
  const email = `new-host-${Date.now()}-${testInfo.parallelIndex}@example.com`
  await clearMailpit(request)

  await page.goto('/')
  await page.getByRole('link', { name: 'Create your account' }).click()
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Display name' }).fill('New Host')
  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByLabel('Password').fill('a sufficiently long password')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  await expect(page.getByText(email)).toBeVisible()

  let message
  await expect
    .poll(
      async () => {
        message = await findVerificationMessage(request, email)
        return message?.ID ?? null
      },
      { message: `verification email for ${email}`, timeout: 15_000 },
    )
    .not.toBeNull()

  const link = verificationUrl(message)
  await page.goto(link)

  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible()
  await page.getByRole('link', { name: 'View your events' }).click()
  await expect(page.getByRole('heading', { name: 'Your hosted events' })).toBeVisible()
  await expect(page.getByText('You have not created any voting events yet.')).toBeVisible()

  await page.goto(link)
  await expect(page.getByRole('alert')).toHaveText('This verification link is invalid or has expired.')
})
