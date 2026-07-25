# Data Model: Unified Add Flow

Feature adds no persistent entity or schema migration. Existing Category, Entry, Account, and
entry-derived Participant records remain authoritative.

## Transient Add Session

Client-only state scoped to one open bottom sheet.

| Field | Type | Rules |
|---|---|---|
| `eventId` | identifier | Required; immutable during session |
| `mode` | `choose`, `category`, `entry` | Starts as `choose` |
| `entryStep` | `details`, `owner`, `title` | Present only for Entry mode |
| `categoryId` | identifier or null | Required before Entry save; defaults from active `isDefault` |
| `categoryTitle` | string | Present only for Category mode; existing length/uniqueness rules |
| `ownerSelection` | existing account or provisional account input | Required before Entry save |
| `entryTitle` | string | Required; existing maximum length |
| `idempotencyKey` | string | Stable per submission attempt |
| `status` | idle, loading, saving, error | Prevents duplicate interactive submission |
| `fieldErrors` | field/message collection | Returned validation is shown beside affected controls |

Add Session is discarded after successful save or explicit dismissal.

## Existing Category

- Belongs to one event.
- Active categories alone appear in selection.
- Exactly one active category is expected to carry `isDefault: true`.
- Creation retains existing title validation, uniqueness, authorization, audit, and idempotency rules.
- Archived category may never be selected.

## Existing Entry

- Belongs to one event through exactly one active category.
- Owned by exactly one account.
- Title remains required and validated by existing domain rules.
- Successful creation makes owner appear in entry-derived Participant view.
- Creation retains existing authorization, audit, and idempotency rules.

## Existing Account

- Selected from existing entry-owner choices or created provisionally through established owner flow.
- Duplicate identity prevention remains server-authoritative.
- Account may persist even if a later Entry submission fails; retry selects/reuses account.

## Derived Participant

- Not created independently.
- Exists in event view while account owns at least one active entry.
- Participant count equals distinct owners of active event entries.
- Removing direct participant creation does not change participant removal/archive behavior already
  supported by event rules.

## State Transitions

```text
closed
  -> choose
      -> category -> saving -> closed
      -> entry.details -> entry.owner -> entry.title -> saving -> closed

Any non-saving open state -> closed
Any validation/service failure -> current step with preserved valid input
Entry category unavailable -> blocked recovery state
```

Back from a child step returns to its prior step without persisting data. Starting a different add type
from the chooser clears fields unique to the abandoned type.

## Validation Invariants

1. Only current event owner may submit either operation.
2. Category title passes existing category validation.
3. Entry references one active category belonging to event.
4. Default category is resolved by `isDefault`, not array position.
5. Entry owner and title are required.
6. One idempotency key is reused for retries of same submission.
7. Successful save reloads server-authoritative event.
8. Direct participant creation is absent from current UI.
