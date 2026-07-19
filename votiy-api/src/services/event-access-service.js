import { ApplicationError, ErrorCode } from '../domain/errors.js'

export function createEventAccessService({ eventRepository }) {
  return Object.freeze({
    async requireManager(eventId, viewer, options = {}) {
      if (!viewer?.account?._id) throw new ApplicationError(ErrorCode.AUTHENTICATION_REQUIRED)
      const event = await eventRepository.findById(eventId, options)
      if (!event) throw new ApplicationError(ErrorCode.NOT_FOUND)
      if (String(event.ownerAccountId) !== String(viewer.account._id)) {
        throw new ApplicationError(ErrorCode.FORBIDDEN)
      }
      return event
    },
  })
}
