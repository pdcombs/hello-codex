import { ObjectId } from 'mongodb'

export const AUDIT_EVENT_NAMES = Object.freeze([
  'account.registered', 'account.verified', 'authentication.signed_in', 'authentication.failed',
  'authentication.signed_out', 'authorization.denied', 'email.sent', 'email.failed',
  'event.created', 'event.registration_policy_changed', 'participant.added', 'participant.removed',
  'participant.self_registered', 'provisional_account.created',
  'participant.entries_created',
  'event.category_created', 'event.category_renamed', 'event.category_change_denied',
  'entry.created', 'entry.archived', 'participant.entries_archived',
  'entry.title_changed',
  'event.category_archived',
  'event.voting_rules_updated', 'voting.codes_generated', 'voting.code_consumed',
  'event.voter_access_granted', 'voting.ballot_submitted', 'event.voting_change_denied', 'voting.ballot_denied',
  'event.photo_uploaded', 'event.photo_replaced', 'event.photo_deleted',
  'event.visibility_changed', 'event.archived', 'event.visibility_change_denied',
  'event.details_updated', 'event.details_change_denied',
  'password_reset.requested', 'password_reset.bypassed', 'password_reset.email_sent',
  'password_reset.email_failed', 'password_reset.denied', 'password_reset.completed',
  'voting.state_opened', 'voting.state_closed', 'voting.state_change_denied',
  'voting.access_allowed', 'voting.access_denied', 'voting.code_claimed', 'voting.code_validated',
  'voting.code_reuse_denied', 'voting.code_ballot_attached',
  'voting.ballot_history_viewed', 'voting.code_reconciled',
])

const outcomes = new Set(['success', 'denied', 'failure'])
const metadataKeys = new Set(['errorCode', 'registrationPolicy', 'registrationSource', 'lifecycleStatus',
  'verificationStatus', 'entryCount', 'archiveReason', 'categoryId', 'entryId', 'ownerAccountId',
  'provisionalCreated', 'promotedCategoryId'])
metadataKeys.add('rulesVersion')
metadataKeys.add('accessPolicy')
metadataKeys.add('codeCount')
metadataKeys.add('categoryCount')
metadataKeys.add('photoRevision')
metadataKeys.add('width')
metadataKeys.add('height')
metadataKeys.add('byteLength')
metadataKeys.add('priorVisibility')
metadataKeys.add('requestedVisibility')
metadataKeys.add('priorLifecycleStatus')
metadataKeys.add('requestedLifecycleStatus')
metadataKeys.add('reasonCode')
metadataKeys.add('changedFields')
metadataKeys.add('deliveryPath')
metadataKeys.add('votingStateVersion')
metadataKeys.add('hasUnusedCodes')
metadataKeys.add('durationMs')
metadataKeys.add('pageSize')
metadataKeys.add('hasMore')

function sanitizeMetadata(metadata = {}) {
  const entries = Object.entries(metadata)
  if (entries.some(([key]) => !metadataKeys.has(key))) throw new TypeError('Audit metadata contains a disallowed field')
  return Object.fromEntries(entries)
}

export function createAuditEventRepository(database) {
  const collection = database.collection('auditEvents')
  return Object.freeze({
    async append({ name, actorAccountId = null, subjectType, subjectId, outcome, correlationId, metadata = {} }, options = {}) {
      if (!AUDIT_EVENT_NAMES.includes(name)) throw new TypeError('Unknown audit event name')
      if (!outcomes.has(outcome)) throw new TypeError('Unknown audit event outcome')
      if (!subjectType || !subjectId || !correlationId) throw new TypeError('Audit subject and correlation ID are required')
      const document = {
        _id: new ObjectId(), name, actorAccountId, subjectType, subjectId: String(subjectId), outcome,
        correlationId, metadata: sanitizeMetadata(metadata), createdAt: new Date(), schemaVersion: 1,
      }
      await collection.insertOne(document, options)
      return Object.freeze({ ...document })
    },
  })
}
