import { ObjectId } from 'mongodb'

export function encodeBallotHistoryCursor(ballot) {
  return Buffer.from(JSON.stringify({ submittedAt: ballot.submittedAt.toISOString(), id: String(ballot._id) }))
    .toString('base64url')
}

export function decodeBallotHistoryCursor(cursor) {
  if (!cursor) return null
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    const submittedAt = new Date(value.submittedAt)
    if (!ObjectId.isValid(value.id) || Number.isNaN(submittedAt.getTime())) throw new TypeError()
    return { submittedAt, id: new ObjectId(value.id) }
  } catch {
    throw new TypeError('Invalid ballot history cursor')
  }
}

export function ballotHistoryPageSize(first = 20) {
  if (!Number.isInteger(first) || first < 1 || first > 100) throw new TypeError('Invalid ballot history page size')
  return first
}
