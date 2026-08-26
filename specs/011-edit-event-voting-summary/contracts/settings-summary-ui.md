# Settings and Voting Summary UI Contract

## Event Details Form

Event Settings presents a distinct `Event details` form before visibility and voting rules.

| Control | Initial value | Validation | Save value |
|---|---|---|---|
| Title | Current title | Required; trim; 1–120 | Trimmed string |
| Description | Current description or blank | Optional; trim; max 2,000 | Trimmed string or null |
| Location | Current location or blank | Optional; trim; max 300 | Trimmed string or null |

Save sends the loaded `updatedAt`. Success reloads the event before another settings section can save with a
stale token. Archived views display values read-only and no save action. Field validation is inline; conflict
asks the host to reload; service failure preserves edits for retry; saving prevents duplicate submission.

## Voting Information Placement

For a full event projection, render one voting-information block in `EventWorkspaceSummary`:

```text
title
description (when present)
location (when present)
voting schedule + access sentence + method sentence
categories / ballot / registration content
```

Render no block for `PRIVATE_SUMMARY` or when authoritative voting rules are absent. Render access/method text
when rules exist. Render the schedule only when both instants are valid.

## Schedule

- Show both opening and closing values.
- Format in viewer-local locale and timezone.
- Include an explicit timezone abbreviation/name.
- Use semantic `time` elements whose machine value is the UTC instant.
- Do not show a partial or invalid window.

## Access Wording Matrix

| Active policy | Host | Public/non-host |
|---|---|---|
| `CODE` | Voters need a code to vote. | This event requires a registered code to vote. |
| `ACCOUNT` | Voters need a completed account to vote. | You need a completed account to vote in this event. |
| `UNRESTRICTED` | Anyone with the event link can vote. | Anyone with this event link can vote. |

## Method Wording Matrix

| Active event method | Host | Public/non-host |
|---|---|---|
| `SINGLE` | Voters choose one entry in each category. | Choose one entry in each category. |
| `MULTIPLE` | Voters choose {minimum}–{maximum} entries in each category. | Choose {minimum}–{maximum} entries in each category. |
| `RANKING` | Voters rank all entries in each category. | Rank all entries in each category. |

Unknown values fail closed: omit the affected sentence and report a privacy-safe diagnostic rather than
inventing wording.

## Event-Wide Rule Editor

- Exactly one `Voting method` control is rendered.
- `Choose multiple` exposes exactly one minimum and maximum pair.
- No category legend or category-specific method/bounds control is rendered.
- Submission uses `defaultCategoryRule` and an empty compatibility `categoryRules` list.
- Server output `categoryRules` is empty; dormant persistence never reaches the UI.
- A readiness message lists active categories that cannot satisfy the event-wide maximum.

## Completed-Account Switch

Visible only when `Who can vote` is `Voting code required`.

- Native checkbox state with `role="switch"`.
- Persistent label: `Require completed account`.
- Visible text communicates `On` or `Off` without relying on color.
- Help text explains that enabled voters need a completed account in addition to a code.
- Help is programmatically associated with the switch.
- Space toggles while focused; pointer and touch operate the same control.
- Focus indicator is clearly visible; target is at least 44×44 CSS pixels.
- When on, ballots-per-account control is present; when off, it is absent.
- State changes require the existing `Save voting rules` action.

## Private Summary Contract

The private non-host response and normalized client object exclude or null all of:

- voting opening/closing instants;
- access policy and repeat policy;
- event/category method and bounds;
- completed-account requirement and ballot limit;
- voting status/capability and codes.

The browser must not request voting capability after receiving `PRIVATE_SUMMARY`.

## Accessibility and Responsive Behavior

- All controls have persistent labels, field errors, and status announcements.
- New content has no required motion and respects reduced-motion settings.
- Form, switch, schedule, and sentences work at 320 CSS pixels and 200% text zoom without horizontal scroll.
- Reading order follows visual order; schedule and sentences remain plain text to assistive technology.
- Localized dates may wrap without truncation.

## Error Mapping

| Result | UI behavior |
|---|---|
| `VALIDATION_FAILED` | Inline field/rule message; retain edits |
| `AUTHENTICATION_REQUIRED` / `FORBIDDEN` | Settings unavailable or permission alert; no optimistic update |
| `CONFLICT` | Explain that event/rules changed or event is archived; offer reload |
| `SERVICE_UNAVAILABLE` / `INTERNAL_ERROR` | Retryable general alert with correlation ID; retain edits |
