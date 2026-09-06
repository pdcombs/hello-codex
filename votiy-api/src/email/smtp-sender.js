import nodemailer from 'nodemailer'

export function smtpTransportOptions({ host, port, secure = false, username = '', password = '' }) {
  if (Boolean(username) !== Boolean(password)) throw new TypeError('SMTP username and password must both be provided')
  const options = { host, port, secure }
  if (username || password) options.auth = { user: username, pass: password }
  return options
}

export function createSmtpSender(configuration) {
  const transport = nodemailer.createTransport(smtpTransportOptions(configuration))
  return Object.freeze({
    send: (message) => transport.sendMail(message),
    verify: () => transport.verify(),
  })
}
