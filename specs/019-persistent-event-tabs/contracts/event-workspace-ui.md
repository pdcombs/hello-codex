# UI Contract: Event Workspace

## Routes

| URL | Content | Selected tab |
| --- | --- | --- |
| `/events/:publicId` | Entries | Entries |
| `/events/:publicId/participants` | Participants | Participants |
| `/events/:publicId/results` | Results | Results |

Parent remains mounted across these URLs for same `publicId`.

## Outlet context

```js
{ event, reloadEvent, setEvent }
```

- `event`: owner-authorized shared event detail.
- `reloadEvent`: updates summary in place without initial loading UI.
- `setEvent`: accepts authoritative event returned by existing mutations.

## Rendering

- Initial event pending/failure may use full-page status.
- Once ready, summary and tabs remain until leaving workspace or changing event.
- Child pending/failure/empty/success renders only inside content region.
- Retryable child failure includes retry.
- Obsolete async responses cannot replace active child content.
- Unauthorized child data never renders before owner verification.

No GraphQL, persistence, or public URL changes.
