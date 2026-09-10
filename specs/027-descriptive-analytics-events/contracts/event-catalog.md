# Event Catalog Contract

Authoritative complete list: `votiy-web/src/analytics/analytics-events.js`, export `ANALYTICS_EVENTS`. New tracking events must add one named constant there, update semantic mapping, and import catalog reference at dispatch site. Inline provider event-name strings are invalid.

## Page

- Provider event: `page_view`
- Parameters: normalized `page_route`, safe `page_title`
- One event per completed route navigation

## Buttons

- Pattern: `click_<approved_action>_button`
- Example: `click_open_voting_button`
- Unknown/dynamic action: `click_other_button`
- Current exact values: all `CLICK_*` entries in `ANALYTICS_EVENTS`

## Failures

- Pattern: `error_<approved_category>`
- Example: `error_service_unavailable`
- Unknown failure: `error_action_not_completed`
- Current exact values: all `ERROR_*` entries in `ANALYTICS_EVENTS`

## Invariants

- Every name declared once in source catalog
- Every dispatch name must belong to catalog
- Names match `^[a-z][a-z0-9_]{0,39}$`
- No raw paths, IDs, aliases, tokens, codes, labels, titles, form values, messages, or stacks
