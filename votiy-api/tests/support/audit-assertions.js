import { expect } from 'vitest'

const forbiddenKeys = ['title', 'description', 'location', 'searchTitleNormalized', 'searchDescriptionNormalized',
  'searchLocationNormalized', 'votingRules', 'code', 'ballot']

export function expectPrivacySafeFeature011Audit(audit) {
  const serialized = JSON.stringify(audit)
  for (const key of forbiddenKeys) expect(serialized).not.toContain(`"${key}"`)
  expect(audit.metadata ?? {}).toEqual(expect.objectContaining({ correlationId: expect.any(String) }))
}

export function expectPrivacySafePasswordResetAudit(audit) {
  const serialized = JSON.stringify(audit)
  for (const key of ['email', 'token', 'password', 'digest', 'message', 'passwordHash', 'tokenDigest']) {
    expect(serialized.toLowerCase()).not.toContain(`"${key.toLowerCase()}"`)
  }
  expect(audit.metadata ?? {}).toEqual(expect.objectContaining({ correlationId: expect.any(String) }))
}
