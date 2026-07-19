import { expect, test } from '@playwright/test'
import { signInHost } from './fixtures/event-setup.js'

test('CUF-001 host configures voting rules and reloads authoritative state', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_OPEN_EVENT_PUBLIC_ID,
    'Synthetic host and event required')
  await signInHost(page)
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('heading', { name: 'Voting rules' })).toBeVisible()
  await page.getByLabel('Who can vote').selectOption('ACCOUNT')
  await page.getByLabel('Ballots allowed per account').fill('2')
  await page.getByRole('button', { name: 'Save voting rules' }).click()
  await page.reload()
  await expect(page.getByLabel('Who can vote')).toHaveValue('ACCOUNT')
  await expect(page.getByLabel('Ballots allowed per account')).toHaveValue('2')
})

test('CUF-001 non-host cannot see host rules editor', async ({ page }) => {
  test.skip(!process.env.E2E_OPEN_EVENT_PUBLIC_ID, 'Synthetic event required')
  await page.goto(`/events/${process.env.E2E_OPEN_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('button', { name: 'Save voting rules' })).toHaveCount(0)
})

test('CUF-002 anonymous voter follows server capability and submits unrestricted ballot', async ({ page }) => {
  test.skip(!process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID, 'Synthetic open voting event required')
  await page.goto(`/events/${process.env.E2E_OPEN_VOTING_EVENT_PUBLIC_ID}`)
  await expect(page.getByRole('heading', { name: 'Vote' })).toBeVisible()
  for (const group of await page.locator('.ballot-category').all()) {
    const radio = group.getByRole('radio').first()
    if (await radio.count()) await radio.check()
    const checkbox = group.getByRole('checkbox').first()
    if (await checkbox.count()) await checkbox.check()
    const selects = group.getByRole('combobox')
    for (let index = 0; index < await selects.count(); index += 1) {
      const select = selects.nth(index); const options = await select.locator('option').all()
      await select.selectOption(await options[index + 1].getAttribute('value'))
    }
  }
  await page.getByRole('button', { name: 'Submit ballot' }).click()
  await expect(page.getByText('Your ballot was submitted.')).toBeVisible()
})

test('CUF-002 direct invalid ballot cannot bypass server rules', async ({ request }) => {
  test.skip(!process.env.E2E_OPEN_VOTING_EVENT_ID, 'Synthetic open voting event ID required')
  const response = await request.post('/graphql', { headers: { Origin: 'http://127.0.0.1:5173',
    'X-Requested-With': 'votiy-web' }, data: { query: `mutation S($input: SubmitEventBallotInput!) {
      submitEventBallot(input: $input) { __typename ... on OperationError { code } }
    }`, variables: { input: { eventId: process.env.E2E_OPEN_VOTING_EVENT_ID, expectedRulesVersion: 1,
      categoryBallots: [], idempotencyKey: crypto.randomUUID() } } } })
  expect((await response.json()).data.submitEventBallot).toMatchObject({ __typename: 'OperationError', code: 'INVALID_BALLOT' })
})

test('CUF-003 account policy rejects anonymous voter with sign-in prompt', async ({ page }) => {
  test.skip(!process.env.E2E_ACCOUNT_VOTING_EVENT_PUBLIC_ID, 'Synthetic account-restricted event required')
  await page.goto(`/events/${process.env.E2E_ACCOUNT_VOTING_EVENT_PUBLIC_ID}`)
  await expect(page.getByText('Sign in to vote in this event.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit ballot' })).toHaveCount(0)
})

test('CUF-005 code-only voter supplies contact without becoming participant', async ({ page }) => {
  test.skip(!process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID || !process.env.E2E_UNUSED_VOTING_CODE,
    'Synthetic code event and unused code required')
  await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  await page.getByLabel('Voting code').fill(process.env.E2E_UNUSED_VOTING_CODE)
  await page.getByLabel('Email').fill(`code-voter-${Date.now()}@example.test`)
  await expect(page.getByLabel(/Phone/)).not.toHaveAttribute('required')
  await expect(page.getByRole('button', { name: 'Submit ballot' })).toBeVisible()
})

test('CUF-004 host generates code, voter consumes it, inventory updates, and reuse fails', async ({ page }) => {
  test.skip(!process.env.E2E_HOST_EMAIL || !process.env.E2E_HOST_PASSWORD || !process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID,
    'Synthetic host and code event required')
  await signInHost(page); await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  await page.getByLabel('Number of codes').fill('1'); await page.getByRole('button', { name: 'Generate codes' }).click()
  const code = await page.locator('.voting-code-list code').first().textContent()
  expect(code).toMatch(/^[a-z0-9]{6}$/)
  await page.context().clearCookies(); await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  async function fillBallot(email) {
    await page.getByLabel('Voting code').fill(code); await page.getByLabel('Email').fill(email)
    for (const group of await page.locator('.ballot-category').all()) {
      const radio = group.getByRole('radio').first(); if (await radio.count()) await radio.check()
      const checkbox = group.getByRole('checkbox').first(); if (await checkbox.count()) await checkbox.check()
      const selects = group.getByRole('combobox')
      for (let index = 0; index < await selects.count(); index += 1) {
        const options = selects.nth(index).locator('option')
        await selects.nth(index).selectOption(await options.nth(index + 1).getAttribute('value'))
      }
    }
  }
  await fillBallot(`consume-${Date.now()}@example.test`)
  await page.getByRole('button', { name: 'Submit ballot' }).click(); await expect(page.getByText('Your ballot was submitted.')).toBeVisible()
  await page.reload(); await fillBallot(`reuse-${Date.now()}@example.test`)
  await page.getByRole('button', { name: 'Submit ballot' }).click()
  await expect(page.getByRole('alert')).toContainText('invalid or unavailable')
  await signInHost(page); await page.goto(`/events/${process.env.E2E_CODE_VOTING_EVENT_PUBLIC_ID}`)
  await expect(page.locator('.voting-code-list').getByText('Used')).toBeVisible()
})
