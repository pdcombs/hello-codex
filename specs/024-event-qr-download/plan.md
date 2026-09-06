# Implementation Plan: Event QR Download

**Branch**: `024-event-qr-download` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/024-event-qr-download/spec.md`

## Summary

Extend existing host short-link editor with visible QR preview and adjacent PNG download action. Use small client-side QR renderer, bind it only to persisted alias, and export canvas through browser download APIs. No API, database, migration, or stored image changes.

## Technical Context

**Language/Version**: JavaScript ES modules; Node.js 24.x; React 19.2

**Primary Dependencies**: React, `qrcode.react` canvas renderer, existing Vite/browser platform APIs

**Storage**: N/A; QR bitmap exists only in browser memory

**Testing**: Vitest 4, Testing Library, user-event, existing Playwright E2E foundation

**Target Platform**: Current mobile and desktop browsers supported by Votiy

**Project Type**: React web application with existing GraphQL backend; feature is client-only

**Performance Goals**: Preview ready within 1 second of settings render; PNG download begins within 1 second of activation

**Constraints**: Always encode `https://www.votiy.com/{savedAlias}`; never encode unsaved alias; valid PNG; keyboard accessible; no persistence or API changes

**Scale/Scope**: One QR preview per event settings page; aliases 3–50 characters plus existing generated identifiers

## Constitution Check

*GATE: Passed before research and after design.*

- **User value and scope**: PASS. Host downloads shareable QR in two interactions; customization and analytics excluded.
- **Identity and ownership**: PASS. Existing host-only settings boundary governs control; QR contains public URL only.
- **Contracts and boundaries**: PASS. UI contract defines saved-alias input, exact URL, PNG output, and failure behavior; API and persistence unchanged.
- **Layered quality**: PASS. Component tests cover URL derivation, unsaved edits, refreshed alias, download, and failure; quickstart defines rendered E2E scan flow.
- **Continuous delivery**: PASS. Existing checks and production build gate `main`; Render deploys tested commit. Smoke flow verifies settings load and downloadable QR.
- **Observability**: PASS. No server operation added. User-visible generation failure is local and actionable; existing readiness remains unchanged.
- **Operational simplicity**: PASS. One focused client dependency; no service, secret, environment variable, migration, or stored asset added.

## Project Structure

### Documentation (this feature)

```text
specs/024-event-qr-download/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── qr-download-ui.md
└── tasks.md
```

### Source Code (repository root)

```text
votiy-web/
├── package.json
├── src/
│   ├── App.css
│   └── features/events/
│       └── EventShortLinkEditor.jsx
└── tests/
    └── component/
        └── event-short-link.test.jsx
```

**Structure Decision**: Extend existing short-link component and tests. QR belongs beside alias control; new standalone service or API boundary would add no value.

## Complexity Tracking

No constitution violations.
