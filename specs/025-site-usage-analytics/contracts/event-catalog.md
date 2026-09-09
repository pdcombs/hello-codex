# Analytics Event Catalog

## Shared rules

Exact production hosts only. Prohibited values: IDs, aliases, tokens, queries, names, emails, phones, user-authored titles, codes, ballots, form values, bodies, correlation IDs, raw errors, and stacks.

## `page_view`

Fields: `page_route`, `page_title`.

Routes: `/`, `/events/new`, `/events/:eventId`, `/events/:eventId/participants`, `/events/:eventId/results`, `/events/:eventId/settings`, `/events/:eventId/vote`, `/events/:eventId/votes`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/sign-in`, `/privacy`, `/:shortLink`, `/not-found`.

## `button_click`

Fields: `page_route`, `action_name`. Approved static UI labels use sentence case. Unknown/dynamic labels become `Other button`.

## `unhappy_path`

Fields: `page_route`, `error_name`, `operation_name`.

Errors: `Validation failed`, `Sign in required`, `Permission denied`, `Request conflicted`, `Resource not found`, `Too many requests`, `Service unavailable`, `Network request failed`, `Unexpected application error`, `Action could not be completed`.

Operations: `Account action`, `Event action`, `Voting action`, `Search action`, `Privacy action`, `Page load`, `Application action`.
