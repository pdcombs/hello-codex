export function createFakeSender({ deliveredAt = () => new Date(), logger = null } = {}) {
  const deliveries = []
  return Object.freeze({
    deliveries,
    async send(message) {
      const delivery = Object.freeze({ ...message, deliveredAt: deliveredAt() })
      deliveries.push(delivery)
      logger?.info({
        operation: 'email.fake.send',
        outcome: 'success',
      }, 'Captured fake email delivery')
      return delivery
    },
    clear() {
      deliveries.splice(0)
    },
  })
}
