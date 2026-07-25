# Implementation Plan: Event Details Navigation

**Branch**: `main` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-event-details-navigation/spec.md`

## Summary

Redesign the owner event workspace around a reusable event summary, URL-addressable Entries,
Participants, and Results tabs, and a separate owner-only Settings page. Add authoritative analytics and
one compressed event photo. Accept bounded raw image uploads through a same-origin authenticated media
endpoint, normalize them to a safe square WebP derivative, store the small binary in a dedicated MongoDB
collection, and serve it through a public revalidating media endpoint. Existing category, entry,
participant, voting-rule, voting-code, and public ballot behavior remains unchanged.

## Technical Context

**Language/Version**: JavaScript ESM on Node.js 24.x; React 19

**Primary Dependencies**: Existing Node HTTP server, GraphQL 16, MongoDB driver 7, Zod 4,
React Router 7, plus `sharp` 0.35.x for server-side image inspection, orientation, resize, and WebP output

**Storage**: Existing MongoDB; new `eventPhotos` collection containing one bounded compressed binary
document per event. Existing event documents remain schema version 3.

**Testing**: Vitest unit/contract/component tests, real-Mongo integration tests, Playwright desktop/mobile
E2E, production smoke, and repository-wide 80% line/branch coverage gates

**Target Platform**: Current desktop/mobile browsers; Render Linux Node service; local Docker and
production MongoDB Atlas

**Project Type**: React web application and Node GraphQL/HTTP service

**Performance Goals**: Event summary and active tab visible within 2 seconds p95, enforced by browser
performance tests and production smoke; cached/revalidated photo visible without layout shift; photo
processing completes within 3 seconds p95 for accepted input; navigation between already-loaded tab shells
responds within 100 ms before data loading, enforced by deterministic component timing tests

**Constraints**: Same-origin only; maximum 10 MiB upload body; accepted JPEG, PNG, and WebP raster inputs;
maximum 40 megapixels; auto-orient and center-crop to 640×640; WebP quality ladder is 80, 70, then 60
only as needed to keep output at or below 350 KiB; no upscaling; reject output that cannot meet the bound
at quality 60; no SVG, GIF,
HEIC, remote URL ingestion, manual crop, or new storage service; image responses use `ETag`,
`Cache-Control: public, max-age=0, must-revalidate`, `nosniff`, and an exact image content type

**Scale/Scope**: One photo per event; up to 100 active categories, existing entry/participant limits,
four owner workspace routes, one public photo-read route, two owner media mutations

## Constitution Check

*GATE: Passed before research and re-checked after design.*

- **User value and scope**: PASS. Host job, four independently testable stories, measurable navigation and
  comprehension outcomes, and explicit exclusions are defined.
- **Identity and ownership**: PASS. Upload/replace/delete require authenticated event ownership at the
  server boundary. Public read exposes only processed image bytes and safe headers.
- **Contracts and boundaries**: PASS. GraphQL carries metadata/analytics, bounded HTTP carries binary,
  services enforce ownership, and a separate repository owns photo persistence.
- **Layered quality**: PASS. Plan requires image-domain unit tests, GraphQL/HTTP/persistence contracts,
  real-Mongo authorization and atomic replace/delete integration tests, component coverage, and CUF E2E.
- **Continuous delivery**: PASS. CI adds native image dependency installation checks, full layered tests,
  build, E2E, and production smoke for photo read and legacy routes.
- **Observability**: PASS. Upload/read/delete emit safe duration, byte-count, outcome, and correlation
  fields; audits contain identifiers and dimensions only; alerts cover processing failures and latency.
- **Operational simplicity**: PASS. MongoDB stores bounded binaries in a separate collection, avoiding a
  new object-storage service. One mature image dependency is justified by safe decoding and compression.

## Design Decisions

### Photo ingestion and storage

- Browser sends original file bytes with `PUT /api/events/:eventId/photo`; no base64 and no multipart
  parser. Required headers include the original raster content type, same-origin credentials,
  `Origin`, `X-Requested-With: votiy-web`, and an idempotency key.
- Handler rejects missing/invalid length before reading and stops once 10 MiB is exceeded. Image processor
  validates actual decoded format, pixel count, and dimensions rather than trusting headers.
- Processor auto-orients, center-crops, avoids enlargement, strips metadata, and outputs one 640×640 WebP
  derivative. A small bounded derivative serves both circular thumbnail and larger preview.
- `eventPhotos` is separate from frequently-read event documents, preventing binary bytes from inflating
  normal event/category queries. One unique document per event is atomically replaced.
- GraphQL projects nullable photo metadata and a stable public URL; image bytes never enter GraphQL,
  logs, audit records, browser state serialization, or event documents.

### Navigation and page composition

- Canonical routes:
  - `/events/:publicId` — Entries
  - `/events/:publicId/participants` — Participants
  - `/events/:publicId/results` — Results placeholder
  - `/events/:publicId/settings` — owner-only settings
- `EventWorkspaceLayout` owns event loading, shared summary, analytics, photo trigger, tabs, focus behavior,
  and route outlet/content selection. Existing `EventCategoryList`, `AddEntryModal`,
  `EventParticipantsPanel`, `EventRulesEditor`, and `VotingCodeManager` remain behaviorally unchanged.
- Tabs are links with tab semantics, so URL, refresh, deep links, and browser history remain authoritative.
- Settings uses a simplified Back-oriented page per mock and does not render summary or tabs.

### Analytics

- API computes category count from active embedded categories, entry count from active event entries, and
  participant count from distinct active entry owner account IDs.
- Counts are added as a nullable additive Event field, guaranteed by `eventByPublicId`. Legacy
  Event-producing mutations may omit it, and existing mutation flows refresh the authoritative event
  detail. Client does not maintain independent counters.
- Counts are public, read-only event facts. Public projection of analytics does not expose owner identity,
  private settings, or any mutation authority; every management operation remains owner-authorized at the
  server boundary.

### Compatibility and migration

- Existing event schema stays version 3. Missing `eventPhotos` row means `photo: null`; no event rewrite.
- Collection validator and unique event index are added idempotently. Existing GraphQL fields and legacy
  fallbacks remain valid; new fields are additive.
- Existing `/events/:publicId/participants` URL remains canonical, preserving bookmarks.
- Public `EventPage` adds photo presentation but retains current voting/registration behavior.

## Project Structure

### Documentation

```text
specs/008-event-details-navigation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/
│   └── requirements.md
└── contracts/
    ├── event-photo-http.md
    ├── schema-extension.graphql
    └── workspace-navigation.md
```

### Source Code

```text
votiy-api/
├── src/
│   ├── api/
│   │   ├── event-photo-handler.js
│   │   └── graphql/
│   │       ├── event-resolvers.js
│   │       └── schema.js
│   ├── domain/
│   │   └── event-photo.js
│   ├── repositories/
│   │   ├── event-photo-repository.js
│   │   └── indexes.js
│   ├── services/
│   │   └── event-photo-service.js
│   ├── app.js
│   └── server.js
└── tests/
    ├── contract/
    ├── integration/
    ├── unit/
    └── support/

votiy-web/
├── src/
│   ├── features/events/
│   │   ├── EventAnalytics.jsx
│   │   ├── EventPhoto.jsx
│   │   ├── EventPhotoDialog.jsx
│   │   ├── EventSettingsPage.jsx
│   │   ├── EventWorkspaceLayout.jsx
│   │   ├── EventWorkspaceTabs.jsx
│   │   ├── OwnerEventPage.jsx
│   │   ├── OwnerEventParticipantsPage.jsx
│   │   └── events.graphql.js
│   └── app/AppRouter.jsx
└── tests/component/

tests/
├── e2e/
│   └── event-details-navigation.spec.js
└── smoke/
    └── production-smoke.js
```

**Structure Decision**: Extend existing API/web feature boundaries. Binary transfer uses a narrow HTTP
handler because the established GraphQL endpoint intentionally caps JSON bodies at 64 KiB. All event
metadata and analytics stay in the additive GraphQL contract.

## Testing Strategy

- **Unit**: content-type/size/pixel validation, EXIF orientation, compression fallback, checksum/revision,
  analytics count derivation, authorization decisions, and photo URL projection.
- **Contract**: `eventPhotos` validator/index, additive GraphQL fields, PUT/GET/DELETE status/header/error
  shapes, raw-body limits, cache headers, and compatibility of all legacy operations.
- **Integration**: real Mongo upload/replace/delete, idempotent retry, owner/non-owner/anonymous denial,
  failed compression rollback, public GET/ETag/304/delete behavior, accurate active counts, and audits.
- **Component**: summary/fallback/photo dialog, upload progress/failures, replace/delete confirmation,
  route-derived tabs, settings relocation, results placeholder, focus return, narrow/short viewports,
  100 ms loaded-shell navigation budget, and absence of owner controls for non-host/anonymous viewers.
- **E2E**: automate CUF-001 through CUF-007 on desktop/mobile, including refresh/history/deep-link,
  keyboard tabs, photo lifecycle, public preview, and direct unauthorized mutation.
- **Smoke**: read existing event without photo, owner uploads synthetic image, public reads it, replace and
  delete, verify fallback, settings route, analytics, participant route, and unchanged voting flow.

## Security, Privacy, and Observability

- Enforce session, same-origin mutation headers, event ownership, body byte limit, decoded pixel limit,
  allowlisted decoded formats, output bound, and rate limit before persistence.
- Strip EXIF and all input metadata. Never log bytes, filenames, original metadata, image checksum,
  session data, or personal contact fields.
- Emit `event.photo_upload`, `event.photo_read`, and `event.photo_delete` structured events with outcome,
  duration, input/output byte counts, dimensions, correlation ID, and safe error code.
- Append `event.photo_uploaded`, `event.photo_replaced`, and `event.photo_deleted` audits containing event
  ID, actor ID, revision, output dimensions, and output byte count only.
- SLI: upload success/error rate, processing p95, photo-read p95, 404 rate, and critical workspace-load
  success. Workspace-read availability target is at least 99% over 15 minutes, excluding expected 403/404
  responses; event-summary visibility target is 2 seconds p95. Alert above 1% unexpected workspace-load
  failures, above 2-second workspace-load p95, above 5% upload failures, or above 3-second processing p95
  for 15 minutes. `docs/operations.md` defines saved log queries (the dashboard-equivalent) for availability,
  latency, error rate, critical journey success, environment, correlation ID, and first diagnostic action.

## Deployment and Rollback

- Add `sharp` with locked platform packages through pnpm; CI and Render build verify native module load on
  Node 24 Linux before deployment.
- No new environment secret or external service. MongoDB storage grows by at most 350 KiB per photographed
  event plus metadata.
- Deploy collection validator/index before writes. Read behavior treats absent collection row as no photo.
- Rollback application commit safely: existing photo documents remain unused but valid; old code ignores
  additive collection and GraphQL fields. Do not delete `eventPhotos` during rollback.
- Production smoke failure blocks completion and identifies failing operation by correlation ID.

## Post-Design Constitution Check

All gates remain PASS. No constitutional violation or unjustified complexity remains.

## Complexity Tracking

No violations.
