export function verificationEmail({ email, token, appOrigin, from }) {
  const link = `${appOrigin}/verify-email?token=${encodeURIComponent(token)}`
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

export function createEmailSender({ transport, appOrigin, from }) {
  if (!transport?.send) throw new TypeError('Email transport is required')
  return Object.freeze({
    async send({ email, token }) {
      return transport.send(verificationEmail({ email, token, appOrigin, from }))
    },
  })
}
