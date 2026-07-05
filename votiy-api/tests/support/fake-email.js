export function createFakeEmailSender() {
  const deliveries = []
  return Object.freeze({
    deliveries,
    async send(message) {
      const delivery = Object.freeze({ ...message, deliveredAt: new Date('2026-01-01T00:00:00.000Z') })
      deliveries.push(delivery)
      return delivery
    },
    clear() { deliveries.splice(0) },
  })
}
