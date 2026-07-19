import { ObjectId } from 'mongodb'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccountRepository } from '../../src/repositories/account-repository.js'
import { ensureCollectionsAndIndexes } from '../../src/repositories/indexes.js'
import { createTestMongo } from '../support/mongo.js'

describe('entry owner contact prefix query', () => {
  let mongo
  beforeAll(async () => { mongo = await createTestMongo(); await ensureCollectionsAndIndexes(mongo.database) })
  afterAll(async () => mongo?.cleanup())

  it('uses bounded normalized email and phone prefixes', async () => {
    const repository = createAccountRepository(mongo.database)
    const referrer = new ObjectId()
    await repository.createProvisional({ displayName: 'Peyton Person', emailNormalized: 'peyton@example.test',
      phoneNormalized: '+15551234567', referredByAccountId: referrer })
    await repository.createProvisional({ displayName: 'Another Person', emailNormalized: 'another@example.test',
      phoneNormalized: '+15557654321', referredByAccountId: referrer })
    expect(await repository.searchByContactPrefix({ type: 'email', prefix: 'pey', limit: 10 }))
      .toHaveLength(1)
    expect(await repository.searchByContactPrefix({ type: 'phone', prefix: '+1555123', limit: 10 }))
      .toHaveLength(1)
    const emailPlan = await mongo.database.collection('accounts').find({
      emailNormalized: { $type: 'string', $gte: 'pey', $lt: 'pey\uffff' },
    }).explain('queryPlanner')
    const phonePlan = await mongo.database.collection('accounts').find({
      phoneNormalized: { $type: 'string', $gte: '+1555123', $lt: '+1555123\uffff' },
    }).explain('queryPlanner')
    expect(JSON.stringify(emailPlan.queryPlanner.winningPlan)).toContain('account_email_unique')
    expect(JSON.stringify(phonePlan.queryPlanner.winningPlan)).toContain('account_phone_unique')
  })
})
