import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const CODE_LENGTH = 6

function keyBuffer(hexKey) {
  const key = Buffer.from(hexKey, 'hex')
  if (key.length !== 32) throw new TypeError('Voting code encryption key must be 32 bytes')
  return key
}

export function generateVotingCode(random = randomBytes) {
  const output = []
  while (output.length < CODE_LENGTH) {
    for (const byte of random(12)) {
      if (byte >= 252) continue
      output.push(ALPHABET[byte % ALPHABET.length])
      if (output.length === CODE_LENGTH) break
    }
  }
  return output.join('')
}

export function digestVotingCode({ eventId, code, key }) {
  return createHmac('sha256', keyBuffer(key)).update(`${eventId}:${code}`).digest('hex')
}

export function encryptVotingCode({ code, key, keyVersion = 1, random = randomBytes }) {
  const iv = random(12)
  const cipher = createCipheriv('aes-256-gcm', keyBuffer(key), iv)
  const ciphertext = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()])
  return Object.freeze({
    codeCiphertext: ciphertext.toString('base64'),
    codeIv: iv.toString('base64'),
    codeAuthTag: cipher.getAuthTag().toString('base64'),
    keyVersion,
  })
}

export function decryptVotingCode({ codeCiphertext, codeIv, codeAuthTag, key }) {
  const decipher = createDecipheriv('aes-256-gcm', keyBuffer(key), Buffer.from(codeIv, 'base64'))
  decipher.setAuthTag(Buffer.from(codeAuthTag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(codeCiphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export async function generateUniqueVotingCodes({ eventId, quantity, key, exists, random = randomBytes }) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000) throw new RangeError('Quantity must be 1–1000')
  const results = []
  const seen = new Set()
  let attempts = 0
  while (results.length < quantity && attempts < quantity * 20) {
    attempts += 1
    const code = generateVotingCode(random)
    const codeDigest = digestVotingCode({ eventId, code, key })
    if (seen.has(codeDigest) || await exists(codeDigest)) continue
    seen.add(codeDigest)
    results.push({ code, codeDigest, ...encryptVotingCode({ code, key, random }) })
  }
  if (results.length !== quantity) throw new Error('Unable to generate unique voting codes')
  return results
}
