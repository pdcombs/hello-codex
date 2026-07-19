const objectIdOrNull = { bsonType: ['objectId', 'null'] }
const stringOrNull = { bsonType: ['string', 'null'] }
const dateOrNull = { bsonType: ['date', 'null'] }

const timestamps = {
  createdAt: { bsonType: 'date' },
  schemaVersion: { bsonType: 'int', minimum: 1 },
}

export const collectionDefinitions = Object.freeze({
  accounts: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['emailNormalized', 'phoneNormalized', 'referredByAccountId', 'lifecycleStatus', 'passwordHash', 'verificationStatus', 'verifiedAt', 'credentialVersion', 'createdAt', 'updatedAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' },
          emailNormalized: stringOrNull,
          phoneNormalized: stringOrNull,
          referredByAccountId: objectIdOrNull,
          lifecycleStatus: { enum: ['provisional', 'completed'] },
          passwordHash: stringOrNull,
          verificationStatus: { enum: ['pending', 'verified'] },
          verifiedAt: dateOrNull,
          credentialVersion: { bsonType: 'int', minimum: 0 },
          createdAt: timestamps.createdAt,
          updatedAt: { bsonType: 'date' },
          schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { emailNormalized: 1 }, name: 'account_email_unique', unique: true, partialFilterExpression: { emailNormalized: { $type: 'string' } } },
      { key: { phoneNormalized: 1 }, name: 'account_phone_unique', unique: true, partialFilterExpression: { phoneNormalized: { $type: 'string' } } },
    ],
  },
  emailVerifications: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['accountId', 'tokenDigest', 'expiresAt', 'consumedAt', 'createdAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, accountId: { bsonType: 'objectId' }, tokenDigest: { bsonType: 'string' },
          expiresAt: { bsonType: 'date' }, consumedAt: dateOrNull, createdAt: timestamps.createdAt,
          schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { tokenDigest: 1 }, name: 'verification_token_unique', unique: true },
      { key: { expiresAt: 1 }, name: 'verification_expiry_ttl', expireAfterSeconds: 0 },
      { key: { accountId: 1, createdAt: -1 }, name: 'verification_account_recent' },
    ],
  },
  sessions: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['accountId', 'secretDigest', 'credentialVersion', 'lastSeenAt', 'expiresAt', 'revokedAt', 'createdAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, accountId: { bsonType: 'objectId' }, secretDigest: { bsonType: 'string' },
          credentialVersion: { bsonType: 'int', minimum: 0 }, lastSeenAt: { bsonType: 'date' },
          expiresAt: { bsonType: 'date' }, revokedAt: dateOrNull, createdAt: timestamps.createdAt,
          schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { secretDigest: 1 }, name: 'session_secret_unique', unique: true },
      { key: { expiresAt: 1 }, name: 'session_expiry_ttl', expireAfterSeconds: 0 },
      { key: { accountId: 1, revokedAt: 1 }, name: 'session_account_active' },
    ],
  },
  events: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['ownerAccountId', 'publicId', 'title', 'description', 'location', 'registrationPolicy', 'createdAt', 'updatedAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, ownerAccountId: { bsonType: 'objectId' }, publicId: { bsonType: 'string' },
          title: { bsonType: 'string', minLength: 1, maxLength: 120 },
          description: { ...stringOrNull, maxLength: 2_000 }, location: { ...stringOrNull, maxLength: 300 },
          registrationPolicy: { enum: ['admin_managed', 'open'] }, createdAt: timestamps.createdAt,
          updatedAt: { bsonType: 'date' }, schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { publicId: 1 }, name: 'event_public_id_unique', unique: true },
      { key: { ownerAccountId: 1, createdAt: -1 }, name: 'event_owner_recent' },
    ],
  },
  eventRegistrations: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['eventId', 'accountId', 'status', 'registrationSource', 'registeredByAccountId', 'removedAt', 'createdAt', 'updatedAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, eventId: { bsonType: 'objectId' }, accountId: { bsonType: 'objectId' },
          status: { enum: ['registered', 'removed'] }, registrationSource: { enum: ['self', 'host'] },
          registeredByAccountId: { bsonType: 'objectId' }, removedAt: dateOrNull, createdAt: timestamps.createdAt,
          updatedAt: { bsonType: 'date' }, schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { eventId: 1, accountId: 1 }, name: 'registration_event_account_unique', unique: true },
      { key: { accountId: 1, status: 1 }, name: 'registration_account_status' },
      { key: { eventId: 1, status: 1, createdAt: 1 }, name: 'registration_event_active' },
    ],
  },
  eventEntries: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['eventId', 'categoryId', 'ownerAccountId', 'title', 'createdByAccountId', 'status',
          'archiveReason', 'archivedAt', 'archivedByAccountId', 'createdAt', 'updatedAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, eventId: { bsonType: 'objectId' }, categoryId: { bsonType: 'objectId' },
          ownerAccountId: { bsonType: 'objectId' }, title: { bsonType: 'string', minLength: 1, maxLength: 160 },
          createdByAccountId: { bsonType: 'objectId' }, status: { enum: ['active', 'archived'] },
          archiveReason: { bsonType: ['string', 'null'] }, archivedAt: dateOrNull,
          archivedByAccountId: objectIdOrNull, createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' },
          schemaVersion: { enum: [1] },
        },
      },
    },
    indexes: [
      { key: { eventId: 1, status: 1, categoryId: 1, createdAt: 1, _id: 1 }, name: 'entry_event_category_active' },
      { key: { eventId: 1, status: 1, ownerAccountId: 1, createdAt: 1, _id: 1 }, name: 'entry_event_owner_active' },
      { key: { ownerAccountId: 1, status: 1, eventId: 1 }, name: 'entry_owner_status_event' },
      { key: { eventId: 1, status: 1, createdAt: -1, ownerAccountId: 1, _id: 1 }, name: 'entry_event_recent_owners' },
    ],
  },
  idempotencyRecords: {
    validator: {
      $jsonSchema: {
        bsonType: 'object', required: ['scope', 'operation', 'key', 'requestDigest', 'resultReference', 'expiresAt', 'createdAt'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, scope: { bsonType: 'string' }, operation: { bsonType: 'string' },
          key: { bsonType: 'string' }, requestDigest: { bsonType: 'string' }, resultReference: { bsonType: 'object' },
          expiresAt: { bsonType: 'date' }, createdAt: timestamps.createdAt,
        },
      },
    },
    indexes: [
      { key: { scope: 1, operation: 1, key: 1 }, name: 'idempotency_scope_operation_key_unique', unique: true },
      { key: { expiresAt: 1 }, name: 'idempotency_expiry_ttl', expireAfterSeconds: 0 },
    ],
  },
  auditEvents: {
    validator: {
      $jsonSchema: {
        bsonType: 'object', required: ['name', 'actorAccountId', 'subjectType', 'subjectId', 'outcome', 'correlationId', 'metadata', 'createdAt', 'schemaVersion'],
        additionalProperties: false,
        properties: {
          _id: { bsonType: 'objectId' }, name: { bsonType: 'string' }, actorAccountId: objectIdOrNull,
          subjectType: { bsonType: 'string' }, subjectId: { bsonType: 'string' },
          outcome: { enum: ['success', 'denied', 'failure'] }, correlationId: { bsonType: 'string' },
          metadata: { bsonType: 'object' }, createdAt: timestamps.createdAt, schemaVersion: timestamps.schemaVersion,
        },
      },
    },
    indexes: [
      { key: { subjectType: 1, subjectId: 1, createdAt: -1 }, name: 'audit_subject_recent' },
      { key: { actorAccountId: 1, createdAt: -1 }, name: 'audit_actor_recent' },
      { key: { correlationId: 1 }, name: 'audit_correlation' },
    ],
  },
})

const categorySchema = {
  bsonType: 'object',
  required: ['_id', 'title', 'titleNormalized', 'isDefault', 'createdAt', 'updatedAt'],
  additionalProperties: false,
  properties: {
    _id: { bsonType: 'objectId' }, title: { bsonType: 'string', minLength: 1, maxLength: 120 },
    titleNormalized: { bsonType: 'string', minLength: 1, maxLength: 120 }, isDefault: { bsonType: 'bool' },
    createdAt: { bsonType: 'date' }, updatedAt: { bsonType: 'date' },
  },
}
const entrySchema = {
  bsonType: 'object',
  required: ['_id', 'categoryId', 'title', 'createdByAccountId', 'createdAt', 'schemaVersion'],
  additionalProperties: false,
  properties: {
    _id: { bsonType: 'objectId' }, categoryId: { bsonType: 'objectId' },
    title: { bsonType: 'string', minLength: 1, maxLength: 160 }, createdByAccountId: { bsonType: 'objectId' },
    createdAt: { bsonType: 'date' }, schemaVersion: { enum: [1] },
  },
}

function installTransitionalSchema(name, additions) {
  const legacy = collectionDefinitions[name].validator.$jsonSchema
  legacy.properties.schemaVersion = { enum: [1] }
  collectionDefinitions[name].validator.$jsonSchema = {
    bsonType: 'object',
    oneOf: [legacy, {
      ...legacy,
      required: [...legacy.required, ...additions.required],
      properties: { ...legacy.properties, ...additions.properties, schemaVersion: { enum: [2] } },
    }],
  }
}

installTransitionalSchema('accounts', {
  required: ['displayName'],
  properties: { displayName: { bsonType: 'string', minLength: 1, maxLength: 100 } },
})
installTransitionalSchema('events', {
  required: ['categories'],
  properties: { categories: { bsonType: 'array', minItems: 1, maxItems: 100, items: categorySchema } },
})
installTransitionalSchema('eventRegistrations', {
  required: ['entries'],
  properties: { entries: { bsonType: 'array', minItems: 1, maxItems: 100, items: entrySchema } },
})

export async function ensureCollectionsAndIndexes(database) {
  const existing = new Set((await database.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name))

  for (const [name, definition] of Object.entries(collectionDefinitions)) {
    if (existing.has(name)) {
      await database.command({ collMod: name, validator: definition.validator, validationLevel: 'strict', validationAction: 'error' })
    } else {
      await database.createCollection(name, { validator: definition.validator, validationLevel: 'strict', validationAction: 'error' })
    }
    await database.collection(name).createIndexes(definition.indexes)
  }
}

export async function enforceEventSetupValidators(database) {
  for (const name of ['accounts', 'events', 'eventRegistrations']) {
    const strictSchema = collectionDefinitions[name].validator.$jsonSchema.oneOf[1]
    await database.command({
      collMod: name,
      validator: { $jsonSchema: strictSchema },
      validationLevel: 'strict',
      validationAction: 'error',
    })
  }
}
