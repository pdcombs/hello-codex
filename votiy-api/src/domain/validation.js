import { z } from 'zod'

const trimmedRequiredText = (maximum, label) => z.string()
  .trim()
  .min(1, `${label} is required`)
  .max(maximum, `${label} must be ${maximum} characters or fewer`)

const optionalText = (maximum, label) => z.string()
  .trim()
  .max(maximum, `${label} must be ${maximum} characters or fewer`)
  .transform((value) => value || null)
  .nullish()
  .transform((value) => value ?? null)

export const emailSchema = z.string().trim().email('Enter a valid email address').max(254)
export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer')
export const idempotencyKeySchema = z.string().uuid('Idempotency key must be a UUID')

export const registerInputSchema = z.object({
  displayName: trimmedRequiredText(100, 'Display name'),
  email: emailSchema,
  password: passwordSchema,
  idempotencyKey: idempotencyKeySchema,
  returnTo: z.string().max(500).nullish().transform((value) => value || null)
    .refine((value) => value === null || (value.startsWith('/') && !value.startsWith('//')), 'Return path is invalid'),
}).strict()

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
}).strict()

export const requestPasswordResetInputSchema = z.object({ email: emailSchema }).strict()
export const inspectPasswordResetInputSchema = z.object({ token: z.string().min(16).max(512) }).strict()
export const resetPasswordInputSchema = z.object({
  token: z.string().min(16).max(512), password: passwordSchema, passwordConfirmation: passwordSchema,
}).strict().superRefine((value, context) => {
  if (value.password !== value.passwordConfirmation) context.addIssue({ code: 'custom',
    path: ['passwordConfirmation'], message: 'Passwords must match' })
})

export const eventInputSchema = z.object({
  title: trimmedRequiredText(120, 'Title'),
  description: optionalText(2_000, 'Description'),
  location: optionalText(300, 'Location'),
  registrationPolicy: z.enum(['ADMIN_MANAGED', 'OPEN']).default('ADMIN_MANAGED'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const participantIdentifierSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Enter a phone number in E.164 format').nullish()
    .transform((value) => value ?? undefined),
})

export const setEventRegistrationPolicyInputSchema = z.object({
  eventId: z.string().min(1),
  registrationPolicy: z.enum(['ADMIN_MANAGED', 'OPEN']),
}).strict()

export const setEventVotingStatusInputSchema = z.object({
  eventId: z.string().min(1), status: z.enum(['OPEN', 'CLOSED']), expectedVersion: z.number().int().min(1),
}).strict()

export const requestVotingAccessInputSchema = z.object({
  eventId: z.string().min(1), accessCode: z.string().trim().min(1).max(128).nullish()
    .transform((value) => value || null),
}).strict()

export const submitEventBallotInputSchema = z.object({
  eventId: z.string().min(1),
  expectedRulesVersion: z.number().int().min(1),
  expectedVotingStateVersion: z.number().int().min(1),
  categoryBallots: z.array(z.object({
    categoryId: z.string().min(1),
    entryIds: z.array(z.string().min(1)).max(5_000),
  }).strict()).max(1_000),
  accessCode: z.string().trim().min(1).max(128).nullish().transform((value) => value || null),
  provisionalVoter: z.object({ email: emailSchema, phone: z.string().max(32).nullish() }).strict().nullish(),
  idempotencyKey: z.string().min(1).max(200),
  browserMarker: z.string().min(1).max(512).nullish(),
}).strict().superRefine((value, context) => {
  const categories = new Set()
  value.categoryBallots.forEach((ballot, index) => {
    if (categories.has(ballot.categoryId)) context.addIssue({ code: 'custom',
      path: ['categoryBallots', index, 'categoryId'], message: 'Each category can appear only once.' })
    categories.add(ballot.categoryId)
    if (new Set(ballot.entryIds).size !== ballot.entryIds.length) context.addIssue({ code: 'custom',
      path: ['categoryBallots', index, 'entryIds'], message: 'Each entry can appear only once per category.' })
  })
})

export const addEventParticipantInputSchema = z.object({
  eventId: z.string().min(1),
  displayName: trimmedRequiredText(100, 'Display name'),
  email: emailSchema,
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Enter a phone number in E.164 format').nullish()
    .transform((value) => value ?? undefined),
  idempotencyKey: idempotencyKeySchema,
  entries: z.array(z.object({
    title: trimmedRequiredText(160, 'Entry title'),
    categoryId: z.string().min(1, 'Category is required'),
  }).strict()).min(1, 'At least one entry is required').max(100),
}).strict()

export const removeEventParticipantInputSchema = z.object({
  eventId: z.string().min(1),
  registrationId: z.string().min(1),
}).strict()

export const archiveEventEntryInputSchema = z.object({
  eventId: z.string().min(1),
  entryId: z.string().min(1),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const archiveEventParticipantEntriesInputSchema = z.object({
  eventId: z.string().min(1),
  accountId: z.string().min(1),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const registerForEventInputSchema = z.object({
  eventId: z.string().min(1),
  entries: z.array(z.object({
    title: trimmedRequiredText(160, 'Entry title'),
    categoryId: z.string().min(1, 'Category is required'),
  }).strict()).min(1, 'At least one entry is required').max(100),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const addEventCategoryInputSchema = z.object({
  eventId: z.string().min(1),
  title: trimmedRequiredText(120, 'Category title'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

export const renameEventCategoryInputSchema = z.object({
  eventId: z.string().min(1),
  categoryId: z.string().min(1),
  title: trimmedRequiredText(120, 'Category title'),
  idempotencyKey: idempotencyKeySchema,
}).strict()

const validTimestamp = z.coerce.date().refine((value) => !Number.isNaN(value.getTime()), 'Enter a valid timestamp')

export const updateEventDetailsInputSchema = z.object({
  eventId: z.string().min(1),
  title: trimmedRequiredText(120, 'Title'),
  description: optionalText(2_000, 'Description'),
  location: optionalText(300, 'Location'),
  expectedUpdatedAt: validTimestamp,
}).strict()

export const updateEventCategoryInputSchema = z.object({
  eventId: z.string().min(1),
  categoryId: z.string().min(1),
  title: trimmedRequiredText(120, 'Category title'),
  expectedCategoryUpdatedAt: validTimestamp,
  entryTitles: z.array(z.object({
    entryId: z.string().min(1),
    title: trimmedRequiredText(160, 'Entry title'),
    expectedUpdatedAt: validTimestamp,
  }).strict()).max(5_000, 'A category can contain at most 5,000 editable entries'),
  idempotencyKey: idempotencyKeySchema,
}).strict().superRefine((value, context) => {
  const seen = new Set()
  value.entryTitles.forEach((entry, index) => {
    if (seen.has(entry.entryId)) context.addIssue({ code: 'custom', path: ['entryTitles', index, 'entryId'],
      message: 'Each entry can appear only once.' })
    seen.add(entry.entryId)
  })
})

export const archiveEventCategoryInputSchema = z.object({
  eventId: z.string().min(1), categoryId: z.string().min(1),
  expectedEventUpdatedAt: validTimestamp, expectedCategoryUpdatedAt: validTimestamp,
  activeEntries: z.array(z.object({ entryId: z.string().min(1), expectedUpdatedAt: validTimestamp }).strict())
    .max(5_000, 'A category can contain at most 5,000 active entries'),
  idempotencyKey: idempotencyKeySchema,
}).strict().superRefine((value, context) => {
  const seen = new Set()
  value.activeEntries.forEach((entry, index) => {
    if (seen.has(entry.entryId)) context.addIssue({ code: 'custom', path: ['activeEntries', index, 'entryId'],
      message: 'Each entry can appear only once.' })
    seen.add(entry.entryId)
  })
})

const optionalEmailSchema = z.string().trim().transform((value) => value || null).nullish()
  .transform((value) => value ?? null)
  .refine((value) => value === null || z.string().email().safeParse(value).success, 'Enter a valid email address')
const optionalPhoneSchema = z.string().trim().transform((value) => value || null).nullish()
  .transform((value) => value ?? null)
  .refine((value) => value === null || /^\+[1-9]\d{7,14}$/.test(value), 'Enter a phone number in E.164 format')

export const entryOwnerChoicesInputSchema = z.object({
  eventId: z.string().min(1),
  search: z.string().trim().max(254).nullish().transform((value) => value || null),
  first: z.number().int().min(1).max(10).default(10),
}).strict().superRefine((value, context) => {
  if (value.search) {
    const searchableLength = /[a-z@]/i.test(value.search)
      ? value.search.replace(/\s/g, '').length
      : value.search.replace(/\D/g, '').length
    if (searchableLength < 3) {
      context.addIssue({ code: 'custom', path: ['search'], message: 'Enter at least 3 characters.' })
    }
  }
})

export const createEventEntryInputSchema = z.object({
  eventId: z.string().min(1),
  categoryId: z.string().min(1, 'Category is required'),
  title: trimmedRequiredText(160, 'Entry title'),
  accountId: z.string().min(1).nullish().transform((value) => value ?? null),
  provisionalOwner: z.object({
    displayName: trimmedRequiredText(100, 'Display name'),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
  }).strict().nullish().transform((value) => value ?? null),
  idempotencyKey: idempotencyKeySchema,
}).strict().superRefine((value, context) => {
  if (Boolean(value.accountId) === Boolean(value.provisionalOwner)) {
    context.addIssue({ code: 'custom', path: ['accountId'], message: 'Choose one existing or new participant.' })
  }
  if (value.provisionalOwner && !value.provisionalOwner.email && !value.provisionalOwner.phone) {
    context.addIssue({ code: 'custom', path: ['provisionalOwner'], message: 'Enter an email or phone number.' })
  }
})
