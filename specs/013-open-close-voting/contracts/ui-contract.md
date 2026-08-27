# UI Contract: Open / Close Voting

## Host event view

- Voting-rules section shows right-aligned primary **Open Voting** or **Close Voting** control.
- Control locks during request and retains focus after success/failure.
- Open failure for missing rules/entries explains prerequisite.
- Code policy with no unused codes opens successfully, shows warning, and links `/events/:publicId/settings`.
- Open event renders full-width top banner: **Voting is now open**.

## Public event view

- Every viewer, including host, sees top-right **Vote** only while manual state open.
- Closed voting summary says **Voting is closed at this time**.
- Vote click locks action while requesting fresh access.

## Decision handling

| Decision | UI action |
|----------|-----------|
| `ALLOWED` | Navigate to `/events/:publicId/vote` |
| `CLOSED` | Stay; refresh status and announce closure |
| `SIGN_IN_REQUIRED` | Explain; route to `/sign-in?returnTo=/events/:publicId` |
| `ACCOUNT_COMPLETION_REQUIRED` | Explain completion requirement and same return path |
| `CODE_REQUIRED` | Open code modal and focus code input |
| `REPEAT_LIMIT_REACHED` | Stay; show non-destructive error |
| `EVENT_UNAVAILABLE` | Stay; show unavailable state |

## Code modal

- Labeled code input, Cancel, and Continue controls; Enter submits.
- Continue locks during request.
- Invalid/used response uses same safe message and keeps input/modal available for replacement.
- Escape and Cancel return focus to Vote.
- Successful claim navigates to placeholder page.

## Placeholder page

- Event-scoped public route.
- Heading or status says **Voting feature coming soon**.
- Provides link back to event.

## Return path

- Only same-origin relative paths beginning with `/` accepted.
- Sign-in, registration, and verification carry `returnTo` forward.
- Completion returns to event detail; access evaluated again on next Vote click.
