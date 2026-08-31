# Quickstart: Persistent Event Tabs

## Automated validation

```bash
corepack pnpm --dir votiy-web test
corepack pnpm --dir votiy-web lint
corepack pnpm --dir votiy-web build
corepack pnpm test:e2e -- tests/e2e/event-details-navigation.spec.js
```

## Critical flow

1. Open owned event Entries. Initial full-page loading may appear once.
2. Delay Participants request; select Participants.
3. Confirm summary and tabs stay visible; loading appears below tabs.
4. Select Results before prior request completes. Confirm old response never replaces Results.
5. Force Results failure. Confirm error/retry stays below tabs; Entries remains reachable.
6. Retry Results; only section changes.
7. Use Back and Forward; URL, selected tab, and content agree while shell remains.
8. Refresh Participants and Results URLs; correct tab resolves after initial workspace load.

Expected: no `Loading event…` during same-event tabs, no duplicate shared query without explicit refresh, existing authorization unchanged.
