import nodemailer from 'nodemailer'

export function createMailpitSender({ host, port }) {
  const transport = nodemailer.createTransport({ host, port, secure: false })
  return Object.freeze({ send: (message) => transport.sendMail(message) })
}
