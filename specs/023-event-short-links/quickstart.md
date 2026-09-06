# Quickstart: Event Short Links

```bash
pnpm --dir votiy-api test:unit
pnpm --dir votiy-api test:contract
pnpm --dir votiy-api test:integration
pnpm --dir votiy-web test
pnpm --dir votiy-web lint
pnpm --dir votiy-web build
```

1. Confirm existing event shows default public ID alias.
2. Save available `myevent`; visit `/myevent`; confirm canonical event page.
3. Confirm old root alias stops while `/events/:publicId` works.
4. Try duplicate case variant, reserved route, malformed alias, and concurrent claim.
5. Confirm non-host update fails and private event rules remain.
