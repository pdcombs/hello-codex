export function createFakeSender({ deliveredAt = () => new Date() } = {}) {
  const deliveries = []
  return Object.freeze({
    deliveries,
    async send(message) {
      const delivery = Object.freeze({ ...message, deliveredAt: deliveredAt() })
      deliveries.push(delivery)
      return delivery
    },
    clear() {
      deliveries.splice(0)
    },
  })
}
