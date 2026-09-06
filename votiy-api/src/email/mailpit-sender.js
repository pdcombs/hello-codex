import { createSmtpSender } from './smtp-sender.js'

export function createMailpitSender({ host, port }) {
  return createSmtpSender({ host, port, secure: false })
}
