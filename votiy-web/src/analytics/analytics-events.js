export const ANALYTICS_EVENTS = Object.freeze({
  PAGE_VIEW: 'page_view',
  CLICK_SEARCH_EVENTS_BUTTON: 'click_search_events_button',
  CLICK_SIGN_OUT_BUTTON: 'click_sign_out_button',
  CLICK_OPEN_VOTING_BUTTON: 'click_open_voting_button',
  CLICK_CLOSE_VOTING_BUTTON: 'click_close_voting_button',
  CLICK_VOTE_BUTTON: 'click_vote_button',
  CLICK_SUBMIT_VOTE_BUTTON: 'click_submit_vote_button',
  CLICK_SAVE_EVENT_DETAILS_BUTTON: 'click_save_event_details_button',
  CLICK_SAVE_SHORT_URL_BUTTON: 'click_save_short_url_button',
  CLICK_DOWNLOAD_QR_CODE_BUTTON: 'click_download_qr_code_button',
  CLICK_ACCEPT_BUTTON: 'click_accept_button',
  CLICK_DECLINE_BUTTON: 'click_decline_button',
  CLICK_ANALYTICS_PREFERENCES_BUTTON: 'click_analytics_preferences_button',
  CLICK_REFRESH_PAGE_BUTTON: 'click_refresh_page_button',
  CLICK_CLOSE_BUTTON: 'click_close_button',
  CLICK_CANCEL_BUTTON: 'click_cancel_button',
  CLICK_CONTINUE_BUTTON: 'click_continue_button',
  CLICK_SIGN_IN_BUTTON: 'click_sign_in_button',
  CLICK_CREATE_ACCOUNT_BUTTON: 'click_create_account_button',
  CLICK_SAVE_BUTTON: 'click_save_button',
  CLICK_DELETE_BUTTON: 'click_delete_button',
  CLICK_OTHER_BUTTON: 'click_other_button',
  ERROR_VALIDATION_FAILED: 'error_validation_failed',
  ERROR_SIGN_IN_REQUIRED: 'error_sign_in_required',
  ERROR_PERMISSION_DENIED: 'error_permission_denied',
  ERROR_REQUEST_CONFLICTED: 'error_request_conflicted',
  ERROR_RESOURCE_NOT_FOUND: 'error_resource_not_found',
  ERROR_TOO_MANY_REQUESTS: 'error_too_many_requests',
  ERROR_SERVICE_UNAVAILABLE: 'error_service_unavailable',
  ERROR_NETWORK_REQUEST_FAILED: 'error_network_request_failed',
  ERROR_UNEXPECTED_APPLICATION: 'error_unexpected_application',
  ERROR_ACTION_NOT_COMPLETED: 'error_action_not_completed',
})

export const BUTTON_EVENTS_BY_ACTION = new Map([
  ['Search events', ANALYTICS_EVENTS.CLICK_SEARCH_EVENTS_BUTTON],
  ['Sign out', ANALYTICS_EVENTS.CLICK_SIGN_OUT_BUTTON],
  ['Open voting', ANALYTICS_EVENTS.CLICK_OPEN_VOTING_BUTTON],
  ['Close voting', ANALYTICS_EVENTS.CLICK_CLOSE_VOTING_BUTTON],
  ['Vote', ANALYTICS_EVENTS.CLICK_VOTE_BUTTON],
  ['Submit vote', ANALYTICS_EVENTS.CLICK_SUBMIT_VOTE_BUTTON],
  ['Save event details', ANALYTICS_EVENTS.CLICK_SAVE_EVENT_DETAILS_BUTTON],
  ['Save short URL', ANALYTICS_EVENTS.CLICK_SAVE_SHORT_URL_BUTTON],
  ['Download QR code', ANALYTICS_EVENTS.CLICK_DOWNLOAD_QR_CODE_BUTTON],
  ['Accept', ANALYTICS_EVENTS.CLICK_ACCEPT_BUTTON],
  ['Decline', ANALYTICS_EVENTS.CLICK_DECLINE_BUTTON],
  ['Analytics preferences', ANALYTICS_EVENTS.CLICK_ANALYTICS_PREFERENCES_BUTTON],
  ['Refresh page', ANALYTICS_EVENTS.CLICK_REFRESH_PAGE_BUTTON],
  ['Close', ANALYTICS_EVENTS.CLICK_CLOSE_BUTTON],
  ['Cancel', ANALYTICS_EVENTS.CLICK_CANCEL_BUTTON],
  ['Continue', ANALYTICS_EVENTS.CLICK_CONTINUE_BUTTON],
  ['Sign in', ANALYTICS_EVENTS.CLICK_SIGN_IN_BUTTON],
  ['Create account', ANALYTICS_EVENTS.CLICK_CREATE_ACCOUNT_BUTTON],
  ['Save', ANALYTICS_EVENTS.CLICK_SAVE_BUTTON],
  ['Delete', ANALYTICS_EVENTS.CLICK_DELETE_BUTTON],
  ['Other button', ANALYTICS_EVENTS.CLICK_OTHER_BUTTON],
])

export const ERROR_EVENTS_BY_NAME = new Map([
  ['Validation failed', ANALYTICS_EVENTS.ERROR_VALIDATION_FAILED],
  ['Sign in required', ANALYTICS_EVENTS.ERROR_SIGN_IN_REQUIRED],
  ['Permission denied', ANALYTICS_EVENTS.ERROR_PERMISSION_DENIED],
  ['Request conflicted', ANALYTICS_EVENTS.ERROR_REQUEST_CONFLICTED],
  ['Resource not found', ANALYTICS_EVENTS.ERROR_RESOURCE_NOT_FOUND],
  ['Too many requests', ANALYTICS_EVENTS.ERROR_TOO_MANY_REQUESTS],
  ['Service unavailable', ANALYTICS_EVENTS.ERROR_SERVICE_UNAVAILABLE],
  ['Network request failed', ANALYTICS_EVENTS.ERROR_NETWORK_REQUEST_FAILED],
  ['Unexpected application error', ANALYTICS_EVENTS.ERROR_UNEXPECTED_APPLICATION],
  ['Action could not be completed', ANALYTICS_EVENTS.ERROR_ACTION_NOT_COMPLETED],
])

const ALL_EVENT_NAMES = new Set(Object.values(ANALYTICS_EVENTS))
const BUTTON_EVENT_NAMES = new Set(BUTTON_EVENTS_BY_ACTION.values())
const ERROR_EVENT_NAMES = new Set(ERROR_EVENTS_BY_NAME.values())

export function buttonEventName(actionName) {
  return BUTTON_EVENTS_BY_ACTION.get(actionName) ?? ANALYTICS_EVENTS.CLICK_OTHER_BUTTON
}

export function errorEventName(errorName) {
  return ERROR_EVENTS_BY_NAME.get(errorName) ?? ANALYTICS_EVENTS.ERROR_ACTION_NOT_COMPLETED
}

export function isAnalyticsEventName(eventName) { return ALL_EVENT_NAMES.has(eventName) }
export function isButtonEventName(eventName) { return BUTTON_EVENT_NAMES.has(eventName) }
export function isErrorEventName(eventName) { return ERROR_EVENT_NAMES.has(eventName) }
