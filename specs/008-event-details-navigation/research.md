# Research: Event Details Navigation

## Compressed image storage

**Decision**: Store one processed WebP binary per event in a dedicated `eventPhotos` MongoDB collection,
bounded to 350 KiB.

**Rationale**: MongoDB recommends single-document `BinData` for files smaller than its 16 MiB BSON limit.
A separate collection prevents photo bytes from inflating frequent event queries while avoiding a new
storage service. The application output bound stays far below the platform limit.

**Alternatives considered**:

- Embed binary in event: rejected because every event/category read would move unnecessary image bytes.
- GridFS: rejected because bounded derivatives are far below 16 MiB and whole-image atomic replacement is
  simpler as one document.
- Cloud object storage: rejected for MVP because it adds credentials, lifecycle, CORS, and another service.
- External URL: rejected by product decision and because availability/privacy would leave Votiy control.

**Sources**:

- MongoDB document size limit: https://www.mongodb.com/docs/manual/reference/limits/
- MongoDB GridFS guidance for sub-16-MiB files: https://www.mongodb.com/docs/manual/core/gridfs/
- MongoDB guidance to split large fields from frequently read documents:
  https://www.mongodb.com/docs/cloud-manager/schema-advisor/reduce-document-size/

## Image processing

**Decision**: Use server-side `sharp` 0.35.x. Accept JPEG, PNG, and WebP; auto-orient, strip metadata,
center-crop to square, resize to at most 640×640 without enlargement, then encode WebP at quality 80.
If output exceeds 350 KiB, retry at quality 70 and then 60; reject rather than persist lower-quality output.

**Rationale**: Server-side decoding validates actual image content instead of trusting browser metadata.
Sharp supports aspect-preserving cover resize, positioning, no-enlargement behavior, streams/buffers, and
WebP output. One normalized format produces predictable size, safe headers, and consistent presentation.

**Alternatives considered**:

- Browser-only compression: rejected because clients can bypass it and server must enforce storage bounds.
- Preserve original format: rejected because file sizes, metadata, animation, and serving behavior vary.
- Manual crop UI: rejected as explicitly out of scope.
- Native custom decoder: rejected as unsafe and unnecessary.

**Sources**:

- Sharp resize behavior: https://sharp.pixelplumbing.com/api-resize/
- Sharp output options: https://sharp.pixelplumbing.com/api-output/
- Sharp constructor and input controls: https://sharp.pixelplumbing.com/api-constructor/

## Binary transport

**Decision**: Use bounded raw-body HTTP PUT/DELETE/GET endpoints beside GraphQL.

**Rationale**: Current GraphQL JSON request body is capped at 64 KiB. Base64 adds size and memory overhead,
while multipart would add parsing dependency. Raw request streams permit early content-length rejection,
hard byte caps, and direct processing. GraphQL remains metadata/control contract.

**Alternatives considered**:

- Base64 GraphQL mutation: rejected due 64 KiB contract, encoding overhead, and logging/error exposure risk.
- Multipart GraphQL: rejected because project has no multipart contract or parser.
- Signed direct storage upload: rejected because no object-storage service exists.

**Source**:

- Node HTTP streams and chunked bodies: https://nodejs.org/api/http.html

## Cache and deletion semantics

**Decision**: Serve the current derivative at a stable public path with `ETag` and
`Cache-Control: public, max-age=0, must-revalidate`.

**Rationale**: Conditional requests avoid retransmitting unchanged data while requiring revalidation, so
replace/delete becomes visible without waiting through a long immutable cache lifetime.

**Alternatives considered**:

- Immutable revision URL: rejected because already-cached deleted photos could remain visible.
- No cache: rejected because every tab/view would retransmit identical bytes.
- Data URL in GraphQL: rejected because it bloats event payloads and browser memory.

## Workspace navigation

**Decision**: URL-backed tabs with Entries at the base event URL and dedicated Participants, Results, and
Settings paths.

**Rationale**: Existing participant bookmarks remain valid. Links preserve refresh, deep-link, browser
history, opening in a new tab, and accessible navigation semantics. Settings remains separate from the
three content tabs as shown in the mock.

**Alternatives considered**:

- Local component state: rejected because refresh and history lose selected content.
- Query parameter tabs: rejected because an existing participant path is already public contract.
- Four tabs including Settings: rejected because product mock calls for a right-aligned settings control.

## Analytics source

**Decision**: Compute analytics authoritatively from active categories and active entries on event read.
Participant count is distinct active entry owners.

**Rationale**: This matches Feature 003’s entry-derived participant rule and avoids counters drifting after
archive, category removal, or transaction rollback.

**Alternatives considered**:

- Stored counters: rejected because every mutation needs transactional maintenance and repair.
- Client-only counts: rejected because every view would duplicate business logic and could use stale data.

## Dependency and operational fit

**Decision**: Keep current single Node service, React client, MongoDB, Render, and GitHub Actions topology.

**Rationale**: One native image dependency is smaller operational change than a new storage service.
Locked install, native-load CI check, upload limits, metrics, and rollback instructions contain risk.

**Alternatives considered**:

- Separate image worker: rejected at current scale.
- Background processing: rejected because one bounded profile-style derivative should complete inline and
  users need immediate confirmation.
