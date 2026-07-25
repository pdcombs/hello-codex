# Quickstart: Unified Add Flow Validation

## Prerequisites

- MongoDB local container running.
- API and web dependencies installed.
- API on `http://127.0.0.1:4000`.
- Web app on `http://127.0.0.1:5173`.
- Verified host account with event containing one default and one non-default category.

## Automated Validation

```bash
corepack pnpm --dir votiy-api test
corepack pnpm --dir votiy-web test
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e
```

Run coverage and confirm both repositories retain at least 80% line and branch coverage:

```bash
corepack pnpm --dir votiy-api test:coverage
corepack pnpm --dir votiy-web test:coverage
```

## Critical Journeys

### 1. Add Category

1. Sign in as event owner and open Entries.
2. Verify one primary Add button beside Settings.
3. Verify category cards contain Edit but no Add Entry, and page has no Add Category footer.
4. Open Add, choose Category, enter unique title, and save.
5. Confirm sheet closes, category appears, and category analytics increments.
6. Retry invalid and duplicate titles; confirm inline error and preserved value.

### 2. Add Entry for Existing Owner

1. Open Add and choose Entry.
2. Confirm selector defaults to category marked default.
3. Select existing owner, enter title, and save.
4. Confirm entry appears under default category.
5. Open Participants and confirm owner entry count increments.

### 3. Add Entry to Another Category with New Account

1. Open Add, choose Entry, and choose non-default category.
2. Search for unknown identity and create account using existing flow.
3. Enter title and save.
4. Confirm entry appears only under selected category and new owner appears in Participants.

### 4. Participant Simplification

1. Open Participants.
2. Confirm cards and removal actions remain.
3. Confirm no Add Participant disclosure or form.
4. On empty event, confirm guidance directs host to Add Entry.

### 5. Authorization

1. Open same public event signed out and as non-owner.
2. Confirm no Add control.
3. Call existing category and entry mutations directly with non-owner/anonymous sessions.
4. Confirm server denies each request and writes no category, account, or entry.

### 6. Accessibility and Mobile

1. At 320 px width and short landscape height, complete both flows without horizontal page scroll.
2. Use keyboard only: open, choose, move back, submit, and dismiss.
3. Confirm focus trap, Escape/backdrop dismissal, heading focus, field-error association, announced loading,
   and focus return to Add.
4. Enable reduced motion and confirm interaction remains clear.

## Regression Checks

- Category Edit and Remove remain functional.
- Entry Edit and Delete remain functional.
- Participant cards/removal remain functional.
- Public event and public registration remain unchanged.
- Analytics refresh after category/entry creation.
- Replayed saves produce no duplicates.
- Existing production health, event, voting, and photo smoke checks remain green.
