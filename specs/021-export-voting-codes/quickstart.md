# Quickstart: Export Voting Codes

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-web test
pnpm --dir votiy-web lint
pnpm --dir votiy-web build
```

1. Sign in as event host; open event settings.
2. Generate codes and use some for ballots.
3. Confirm Used/Available totals match full inventory.
4. Confirm used rows first and selectable code text.
5. Confirm narrow table horizontal scroll.
6. Export; verify filename and Excel-compatible complete rows.
7. Attempt as non-host; confirm no data or counts leak.
