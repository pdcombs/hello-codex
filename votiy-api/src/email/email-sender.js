export function verificationEmail({ email, token, returnTo = null, appOrigin, from }) {
  const suffix = returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''
  const link = `${appOrigin}/verify-email?token=${encodeURIComponent(token)}${suffix}`
  return Object.freeze({
    from,
    to: email,
    subject: 'Verify your Votiy account',
    email,
    token,
    text: `Verify your Votiy account: ${link}`,
    html: `<p>Verify your Votiy account:</p><p><a href="${link}">Verify email</a></p>`,
  })
}

export function passwordResetEmail({ email, token, appOrigin, from }) {
  const link = `${appOrigin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
  const warning = 'If you did not request this password reset, do not click the link. You can safely ignore this email.'
  return Object.freeze({ from, to: email, subject: 'Reset your Votiy password', email, token,
    text: `Reset your Votiy password: ${link}\n\nThis link expires in 15 minutes.\n\n${warning}`,
    html: `<p>A password reset was requested for your Votiy account.</p><p><a href="${link}">Reset password</a></p><p>This link expires in 15 minutes.</p><p>${warning}</p>`,
  })
}

export function createEmailSender({ transport, appOrigin, from }) {
  if (!transport?.send) throw new TypeError('Email transport is required')
  return Object.freeze({
    async send({ email, token, returnTo = null }) {
      return transport.send(verificationEmail({ email, token, returnTo, appOrigin, from }))
    },
    async sendPasswordReset({ email, token }) {
      return transport.send(passwordResetEmail({ email, token, appOrigin, from }))
    },
  })
}
