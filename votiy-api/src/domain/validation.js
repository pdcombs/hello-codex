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
}).strict()

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
}).strict()

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
