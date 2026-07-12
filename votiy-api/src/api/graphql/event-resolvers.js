import { toClientError } from '../../domain/errors.js'

const successEvent = (event) => ({ __typename: 'EventSuccess', event })
const successList = (events) => ({ __typename: 'EventListSuccess', events })
const successRegistration = (registration) => ({ __typename: 'EventRegistrationSuccess', registration })
const successRegistrations = (registrations) => ({ __typename: 'EventRegistrationListSuccess', registrations })
const failure = (error, correlationId) => ({ __typename: 'OperationError', ...toClientError(error, correlationId) })

export function createEventResolvers({ eventService, eventRegistrationService, eventCategoryService, auditRepository }) {
  return Object.freeze({
    async addEventCategory({ input }, context) {
      try {
        const result = await eventCategoryService.addCategory(input, context.viewer)
        await auditRepository?.append({ name: 'event.category_created', actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'event', subjectId: result.event.id, outcome: 'success', correlationId: context.correlationId })
        return successEvent(result.event)
      } catch (error) {
        if (error.code === 'FORBIDDEN') await auditRepository?.append({ name: 'event.category_change_denied',
          actorAccountId: context.viewer?.account?._id ?? null, subjectType: 'event', subjectId: input.eventId,
          outcome: 'denied', correlationId: context.correlationId, metadata: { errorCode: error.code } })
        return failure(error, context.correlationId)
      }
    },
    async renameEventCategory({ input }, context) {
      try {
        const result = await eventCategoryService.renameCategory(input, context.viewer)
        await auditRepository?.append({ name: 'event.category_renamed', actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'event', subjectId: result.event.id, outcome: 'success', correlationId: context.correlationId })
        return successEvent(result.event)
      } catch (error) {
        if (error.code === 'FORBIDDEN') await auditRepository?.append({ name: 'event.category_change_denied',
          actorAccountId: context.viewer?.account?._id ?? null, subjectType: 'event', subjectId: input.eventId,
          outcome: 'denied', correlationId: context.correlationId, metadata: { errorCode: error.code } })
        return failure(error, context.correlationId)
      }
    },
    async ownedEvents({ first, after }, context) {
      try {
        const result = await eventService.ownedEvents({ viewer: context.viewer, first, after })
        return successList(result.events)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async eventByPublicId({ publicId }, context) {
      try {
        const result = await eventService.eventByPublicId({ publicId, viewer: context.viewer })
        return successEvent(result.event)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async eventRegistrations({ eventId }, context) {
      try {
        const result = await eventRegistrationService.listRegistrations({ eventId }, context.viewer)
        return successRegistrations(result.registrations)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async createEvent({ input }, context) {
      try {
        const result = await eventService.createEvent(input, context.viewer)
        await auditRepository?.append({
          name: 'event.created',
          actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'event',
          subjectId: result.event.id,
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { registrationPolicy: result.event.registrationPolicy },
        })
        return successEvent(result.event)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async setEventRegistrationPolicy({ input }, context) {
      try {
        const result = await eventService.setRegistrationPolicy(input, context.viewer)
        await auditRepository?.append({
          name: 'event.registration_policy_changed',
          actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'event',
          subjectId: result.event.id,
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { registrationPolicy: result.event.registrationPolicy },
        })
        return successEvent(result.event)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async registerForEvent({ input }, context) {
      try {
        const result = await eventRegistrationService.registerForEvent(input, context.viewer)
        await auditRepository?.append({
          name: 'participant.self_registered',
          actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'eventRegistration',
          subjectId: result.registration.id,
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { registrationSource: result.registration.source },
        })
        await auditRepository?.append({
          name: 'participant.entries_created', actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'eventRegistration', subjectId: result.registration.id, outcome: 'success',
          correlationId: context.correlationId, metadata: { entryCount: result.registration.entryCount },
        })
        return successRegistration(result.registration)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async addEventParticipant({ input }, context) {
      try {
        const result = await eventRegistrationService.addParticipant(input, context.viewer)
        if (result.provisionalCreated) {
          await auditRepository?.append({
            name: 'provisional_account.created',
            actorAccountId: context.viewer?.account?._id ?? null,
            subjectType: 'eventRegistration',
            subjectId: result.registration.id,
            outcome: 'success',
            correlationId: context.correlationId,
            metadata: { lifecycleStatus: 'provisional' },
          })
        }
        await auditRepository?.append({
          name: 'participant.added',
          actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'eventRegistration',
          subjectId: result.registration.id,
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { registrationSource: result.registration.source },
        })
        await auditRepository?.append({
          name: 'participant.entries_created', actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'eventRegistration', subjectId: result.registration.id, outcome: 'success',
          correlationId: context.correlationId, metadata: { entryCount: result.registration.entryCount },
        })
        return successRegistration(result.registration)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
    async removeEventParticipant({ input }, context) {
      try {
        const result = await eventRegistrationService.removeParticipant(input, context.viewer)
        await auditRepository?.append({
          name: 'participant.removed',
          actorAccountId: context.viewer?.account?._id ?? null,
          subjectType: 'eventRegistration',
          subjectId: result.registration.id,
          outcome: 'success',
          correlationId: context.correlationId,
          metadata: { registrationSource: result.registration.source },
        })
        return successRegistration(result.registration)
      } catch (error) {
        return failure(error, context.correlationId)
      }
    },
  })
}
