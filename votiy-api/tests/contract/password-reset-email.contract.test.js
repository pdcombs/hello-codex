import { describe, expect, it } from 'vitest'
import { createEmailSender, passwordResetEmail } from '../../src/email/email-sender.js'

describe('password reset email contract', () => {
  it('uses canonical origin, expiry, warning, and matching HTML/text meaning', () => {
    const message = passwordResetEmail({ email: 'user@example.com', token: 'a+b/c', appOrigin: 'https://votiy.test/', from: 'Votiy' })
    expect(message.subject).toBe('Reset your Votiy password')
    expect(message.text).toContain('https://votiy.test/reset-password?token=a%2Bb%2Fc')
    expect(message.text).toContain('expires in 15 minutes')
    expect(message.text).toContain('do not click the link')
    expect(message.html).toContain('Reset password')
  })
  it('dispatches reset message through configured transport', async () => {
    const sent = []; const sender = createEmailSender({ transport: { send: async (message) => sent.push(message) },
      appOrigin: 'https://votiy.test', from: 'Votiy' })
    await sender.sendPasswordReset({ email: 'user@example.com', token: 'token' })
    expect(sent[0]).toMatchObject({ to: 'user@example.com', subject: 'Reset your Votiy password' })
  })
})
