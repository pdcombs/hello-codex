# UI Contract: Find Events Search

## Header Trigger

- Present in shared header for anonymous and authenticated states.
- Icon-only visual control has accessible name `Find events`.
- One activation opens one dialog.

## Dialog

- Accessible role: `dialog`.
- Accessible name: `Find events`.
- Covers viewport and owns internal result scrolling.
- Search input receives focus on open.
- Close button, Escape, and backdrop dismiss.
- Focus returns to trigger after dismissal.
- Query/results reset after close.

## Placeholder Cycle

Order repeats every 2.5 seconds while input value is empty:

1. `motorcycle show in rogers ar`
2. `bbq competition in kansas city`
3. `talent show in bentonville`

Cycle never changes input value. Reduced-motion disables transition animation, not example availability.

## Search State

```text
closed
  -> idle
  -> debouncing
  -> loading-initial
  -> results | empty | error-initial
results
  -> loading-more
  -> results | complete | error-more
any open state
  -> closed
```

- Fewer than two normalized alphanumeric characters remains `idle`.
- New query cancels/invalidates previous request, clears cursor and nodes, then debounces.
- Retry repeats failed request for current query/cursor only.
- Duplicate fetch guard prevents simultaneous request for same cursor.

## Results

- Each result is one keyboard-focusable selection target.
- Display title, concise optional description, and visibility label.
- Display location for public events; omit location for private events.
- No internal IDs or owner-only information.
- `IntersectionObserver` sentinel requests next page.
- Keyboard-reachable `Load more events` fallback provides equivalent action.
- Status region announces initial load, added result count, empty state, errors, and completion.

## Navigation

Selecting `publicId = abc` navigates to:

```text
/events/abc
```

The normal route requests `eventDetailView`. The server selects the response projection from viewer identity:
the host receives the full Event projection regardless of navigation source; a non-host receives the normal
public projection or `PrivateEventSummary`.

Private result route renders navigation labels and private notice with title, description, and analytics
counts only. Protected fields never reach browser response.

## Error Mapping

| API code | UI behavior |
|---|---|
| `VALIDATION_FAILED` | Inline query/cursor message; retain query |
| `SERVICE_UNAVAILABLE` | Retryable status; retain query and existing nodes |
| `INTERNAL_ERROR` | Generic retryable status with correlation ID |

GraphQL/network failures use same generic retryable state. Raw query never appears in logs or error
telemetry.
