const headers = (idempotencyKey) => ({
  'X-Requested-With': 'votiy-web',
  'X-Idempotency-Key': idempotencyKey,
})

async function result(response) {
  const body = await response.json()
  if (!response.ok) {
    const error = new Error(body.message ?? 'Photo update failed.')
    error.code = body.code
    throw error
  }
  return body
}

export function uploadEventPhoto(eventId, file) {
  return fetch(`/api/events/${encodeURIComponent(eventId)}/photo`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { ...headers(crypto.randomUUID()), 'Content-Type': file.type, 'Content-Length': String(file.size) },
    body: file,
  }).then(result)
}

export function deleteEventPhoto(eventId) {
  return fetch(`/api/events/${encodeURIComponent(eventId)}/photo`, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: headers(crypto.randomUUID()),
  }).then(result)
}
