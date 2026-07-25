# Feature 008 Validation

Validated locally on 2026-07-25.

## Automated gates

- API unit, contract, and real-Mongo integration suites: 81 files, 251 tests passed.
- API coverage: 87.83% statements, 80.95% branches, 90.18% functions, 91.90% lines.
- Web component/unit suite: 29 files, 122 tests passed.
- Web coverage: 87.02% statements, 81.71% branches, 84.10% functions, 89.95% lines.
- Web lint: passed.
- Production web build: passed.
- Server syntax checks: passed.
- Feature 008 Playwright journey: desktop and mobile passed.
- Existing category-removal/responsive regression subset: 5 passed, 7 skipped.

## Manual browser checks

- Entries route renders photo fallback, title/details, analytics, settings link, and tabs without
  horizontal overflow.
- Participants and Results direct routes preserve the workspace shell and selected-tab state.
- Direct Settings navigation remains on the protected settings route after session hydration; Back
  returns to the event.
- Public workspace analytics remain readable while owner controls stay hidden.

## Full-suite note

The final parallel repository-wide Playwright run finished with 10 passed, 62 skipped, and 4 failures.
All four failures are pre-existing category-removal fixture races during parallel account sign-in
(`Email` input detached while auth state rerendered); the same affected regression subset passed
against the refreshed API when run in isolation. Feature 008's desktop/mobile journey passed.

## Quality and privacy

- Photo input is bounded by bytes and decoded pixels, normalized to square WebP, metadata stripped,
  and compressed through the fixed 80/70/60 quality ladder.
- Owner authorization and same-origin mutation checks are enforced server-side.
- Public GET/HEAD supports ETag and 304 without exposing private event data.
- Audit/log projections exclude photo bytes and sensitive request/session values.
- API and web line/branch coverage remain above the constitution's 80% gate.
