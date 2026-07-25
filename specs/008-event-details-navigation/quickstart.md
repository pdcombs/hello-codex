# Quickstart: Validate Event Details Navigation

## Prerequisites

- Node.js 24.x and repository pnpm version.
- Local MongoDB replica set and API/web environment from root README.
- Verified host with an event containing multiple categories, multiple participants, and multiple entries.
- Non-owner account and anonymous browser context.
- Small valid JPEG, PNG, and WebP fixtures plus invalid, oversized, and high-pixel-count fixtures.

## Automated gates

```sh
corepack pnpm format:check
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web test:coverage
corepack pnpm build
corepack pnpm test:e2e
```

Expected: all suites pass; repository line and branch coverage remain at least 80%.

## CUF-001: Summary and Entries

1. Open base event URL as host.
2. Verify photo/fallback, accurate active category/participant/entry counts, settings control, title,
   description, and location.
3. Verify Entries selected and existing category/entry actions unchanged.
4. Add and archive an entry; verify entry and participant counts refresh without full browser reload.

## CUF-002: Participants

1. Select Participants and verify URL ends in `/participants`.
2. Refresh and verify Participants remains selected.
3. Verify existing cards and create flow.
4. Add/remove participant entries and verify counts match distinct active owners.

## CUF-003: Results and history

1. Select Results and verify `/results` plus `🎉 Feature Coming Soon`.
2. Use browser back/forward and direct URL load.
3. Verify active tab/content remains URL-driven.

## CUF-004: Settings relocation

1. Activate Settings; verify `/settings`, simplified Back layout, rules editor, and conditional code manager.
2. Verify no settings controls remain on Entries, Participants, or Results.
3. Save voting settings and use Back; verify base Entries view.
4. Request Settings as non-owner and anonymous visitor; verify safe denial.

## CUF-005: Photo lifecycle

1. Upload JPEG, PNG, and WebP fixtures.
2. Verify stored/served output is WebP, at most 640×640 and 350 KiB, with no original metadata.
3. Open preview; replace photo; reload all three content routes.
4. Delete with confirmation; verify immediate 404 from media route and fallback on all views.
5. Cancel deletion and verify photo remains.

## CUF-006/CUF-007: Security and public preview

1. Attempt raw upload/delete as non-owner, anonymous, bad origin, missing request header, and oversized body.
2. Verify denial before persistence and safe correlation-bearing errors.
3. Open public event as anonymous viewer; verify photo and preview, no management controls.
4. Verify logs/audits contain no bytes, filename, metadata, checksum, session, or contact data.
5. Request owner workspace routes as non-host and anonymous users; verify public counts remain readable
   while every event-management control is absent and direct mutations are denied.

## HTTP/cache checks

1. GET current media; record `ETag`, content type, size, and cache policy.
2. Repeat with `If-None-Match`; expect `304`.
3. Replace; old ETag must return new `200`.
4. Delete; GET and HEAD must return `404`.

## Responsive and accessibility

- Test 320px width, short mobile viewport, desktop, zoom, reduced motion, and long event content.
- Use keyboard only for tabs, Settings, photo preview, Replace, Delete confirmation, Close, and Back.
- Verify visible focus, announced progress/errors, dialog focus trap, Escape/backdrop close, and focus return.
- Verify no horizontal page scroll or overlap.
- Measure loaded-shell tab activation and require at most 100 ms; sample normal workspace loads and require
  event summary/content visibility within 2 seconds at p95.

## Production smoke and rollback

1. Deploy exact CI-tested main commit.
2. Read an existing no-photo event and confirm fallback.
3. Synthetic host uploads photo, public GETs it, replaces, deletes, and verifies fallback.
4. Verify analytics, Participants, Results, Settings, and existing voting smoke.
5. On failure roll back application commit; keep `eventPhotos` collection/documents. Old code ignores them.
6. Verify the saved workspace availability, latency, error-rate, and critical-journey queries documented in
   `docs/operations.md`; expected availability is at least 99% excluding intentional authorization/not-found responses.
