import crypto from 'node:crypto'

const STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to'])

export function normalizeSearchText(value = '') {
  return String(value).normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim().replace(/\s+/g, ' ')
}

export function searchTerms(value) {
  return normalizeSearchText(value).split(' ').filter((term) => term.length >= 2 && !STOP_WORDS.has(term))
}

export function createSubstringGrams(value, { maximum = 4992 } = {}) {
  const grams = new Set()
  for (const word of normalizeSearchText(value).split(' ')) {
    for (const length of [2, 3]) {
      for (let index = 0; index <= word.length - length; index += 1) grams.add(word.slice(index, index + length))
    }
  }
  return [...grams].slice(0, maximum)
}

export function createEventSearchProjection({ title = '', description = '', location = '' }) {
  const searchTitleNormalized = normalizeSearchText(title).slice(0, 120)
  const searchDescriptionNormalized = normalizeSearchText(description).slice(0, 2000)
  const searchLocationNormalized = normalizeSearchText(location).slice(0, 300)
  const searchTitleGrams = createSubstringGrams(searchTitleNormalized, { maximum: 256 })
  const searchDescriptionGrams = createSubstringGrams(searchDescriptionNormalized, { maximum: 4096 })
  const searchLocationGrams = createSubstringGrams(searchLocationNormalized, { maximum: 640 })
  return {
    searchTitleNormalized, searchDescriptionNormalized, searchLocationNormalized,
    searchTitleGrams, searchDescriptionGrams, searchLocationGrams,
    searchGrams: [...new Set([...searchTitleGrams, ...searchDescriptionGrams, ...searchLocationGrams])],
  }
}

export function eventMatchesTerms(event, terms) {
  const fields = [event.searchTitleNormalized, event.searchDescriptionNormalized, event.searchLocationNormalized]
  return terms.every((term) => fields.some((field = '') => field.includes(term)))
}

export function eventSearchScore(event, terms) {
  return terms.reduce((score, term) => score
    + (event.searchTitleNormalized?.includes(term) ? 100 : 0)
    + (event.searchDescriptionNormalized?.includes(term) ? 10 : 0)
    + (event.searchLocationNormalized?.includes(term) ? 1 : 0), 0)
}

export function digestSearchQuery(terms) {
  return crypto.createHash('sha256').update(terms.join('\u0000')).digest('base64url')
}

export function createSearchCursor(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function parseSearchCursor(cursor, secret, queryDigest) {
  try {
    const [encoded, signature, extra] = String(cursor).split('.')
    if (!encoded || !signature || extra) throw new Error()
    const expected = crypto.createHmac('sha256', secret).update(encoded).digest()
    const actual = Buffer.from(signature, 'base64url')
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) throw new Error()
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.queryDigest !== queryDigest) throw new Error()
    return payload
  } catch {
    throw new TypeError('Invalid search cursor')
  }
}
