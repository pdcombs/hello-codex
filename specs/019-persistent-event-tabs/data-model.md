# Data Model: Persistent Event Tabs

No persistence changes.

## Event Workspace Context

- `event`: authoritative event detail
- `status`: `loading | success | error` for initial shared context
- `error`: initial load or owner-access failure
- `reloadEvent()`: refresh shared event in place
- `setEvent(event)`: apply authoritative mutation result without replacing workspace

Rules:

- Event `publicId` matches route parameter.
- Event has `isOwner: true` before workspace renders.
- Changing `publicId` resets context and permits full-page loading.
- Same-event child navigation does not reset context.

## Active Tab

- Values: `entries | participants | results`
- Source: nested route/path, never duplicate local state
- Canonical paths remain unchanged.

## Tab Content State

- `status`: `idle | loading | success | empty | error`
- `data`: selected tab domain data
- `error`: actionable tab-scoped failure
- `requestIdentity`: cleanup or abort signal blocking obsolete response display

```text
idle -> loading -> success
                -> empty
                -> error -> loading (retry)
loading -> discarded (unmount or newer request)
```

Tab state never changes parent workspace status after initial success.
