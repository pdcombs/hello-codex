export const invalidResetToken = 'invalid-password-reset-token'

export function uniqueResetEmail(prefix = 'password-reset') {
  return `${prefix}-${Date.now().toString(36)}@example.invalid`
}

export async function openForgotPassword(page) {
  await page.goto('/forgot-password')
  await page.getByLabel('Email').waitFor()
}
