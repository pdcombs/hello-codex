# Research: Persistent Event Tabs

## Shared route ownership

- **Decision**: One React Router parent route for `/events/:publicId` with index, `participants`, and `results` child routes through `Outlet`.
- **Rationale**: Parent remains mounted while sibling children change. Summary, tabs, event request, and add-sheet state remain stable.
- **Alternatives considered**: Sibling routes plus cache still remount layout. Rendering all tabs eagerly loads data and complicates accessibility.

## Shared event state

- **Decision**: Parent loads `loadEventDetailView(publicId)`, verifies ownership, and provides `{ event, reloadEvent, setEvent }` through outlet context.
- **Rationale**: Entries needs categories, Participants needs event identity, Results uses shared event for shell while its operation loads results.
- **Alternatives considered**: New Context provider adds abstraction. Repeating event query causes flash and duplicate work.

## Content request behavior

- **Decision**: Children render loading/error/retry inside content region; abort or ignore obsolete requests on navigation.
- **Rationale**: Parent stays visible and stale responses cannot paint after rapid navigation.
- **Alternatives considered**: Global route fallback removes context. Suspense/data-router migration exceeds scope.

## URL and accessibility

- **Decision**: Preserve links and paths, derive selected tab from location, retain tab roles and `aria-selected`.
- **Rationale**: Deep links, refresh, history, bookmarks, focus, and screen readers remain compatible.
- **Alternatives considered**: Local-only tab state breaks URLs and history.

## Testing

- **Decision**: Integration-style component tests use deferred promises and request counters; Playwright verifies persistent heading during navigation.
- **Rationale**: Proves DOM continuity, one event request, contained states, retry, and history selection.
- **Alternatives considered**: Snapshots cannot prove lifecycle or async navigation.
