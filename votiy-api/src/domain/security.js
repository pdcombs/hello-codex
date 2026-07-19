import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function normalizeEmail(value) {
  return value.trim().toLocaleLowerCase('en-US')
}

export function normalizePhone(value) {
  if (value == null || String(value).trim() === '') return null
  const source = String(value).trim()
  const digits = source.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (source.startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return source
}

export function generateOpaqueToken(byteLength = 32) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16) {
    throw new TypeError('Token byte length must be an integer of at least 16')
  }

  return randomBytes(byteLength).toString('base64url')
}

export function digestSecret(secret, pepper) {
  if (!secret || !pepper) throw new TypeError('Secret and pepper are required')
  return createHash('sha256').update(pepper).update('\0').update(secret).digest('hex')
}

export function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

export function digestIdempotencyRequest(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')
}
