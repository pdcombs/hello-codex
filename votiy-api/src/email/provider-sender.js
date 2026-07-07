export function createProviderSender({ endpoint, apiKey, fetchImpl = globalThis.fetch }) {
  return Object.freeze({
    async send(message) {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(message),
      })
      if (!response.ok) throw new Error('Email provider rejected delivery')
      return response.json().catch(() => ({}))
    },
  })
}
