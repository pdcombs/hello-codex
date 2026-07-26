# Votiy

Votiy is a voting-event platform being developed through GitHub Spec Kit's spec-driven workflow. The
current foundation is a React application connected to a Node.js GraphQL API and MongoDB.

The local workspace and Docker Compose project are named `votiy-app`.

## Spec-driven development

Project principles live in `.specify/memory/constitution.md`, and feature artifacts live under `specs/`.
The standard flow is constitution → specify → clarify → plan → tasks → analyze → implement.

Quality gates require layered unit, contract, integration, and UI end-to-end tests. Every successful
`main` pipeline deploys the tested commit to production, runs post-deploy smoke checks, and relies on
structured observability signals for rapid diagnosis and rollback.

Operational runbook lives in [docs/operations.md](./docs/operations.md).

## Local development

Start the single-node MongoDB replica set and Mailpit from the repository root, then wait for the
database initializer and both long-running containers:

```bash
docker compose up -d --wait
docker compose ps
```

Do not start the API until `votiy-mongodb` shows `healthy` and `votiy-mongodb-init` has exited with
code 0. Transactions require MongoDB to be a writable replica-set primary. If Docker Desktop was
stopped, start it first and rerun these commands.

Start the Votiy API:

```bash
cd votiy-api
pnpm install
cp .env.example .env.local
pnpm dev
```

If `.env.local` already exists from an older setup, make sure its local MongoDB connection matches
the Compose credentials:

```dotenv
MONGODB_URI=mongodb://root:localpassword@127.0.0.1:27017/votiy?authSource=admin&replicaSet=rs0
```

Start the Votiy React web app in another terminal:

```bash
cd votiy-web
pnpm install
pnpm dev
```

Open <http://127.0.0.1:5173>.

### Local MongoDB troubleshooting

`MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017` means no MongoDB process is
reachable on the local port. From the repository root, check and restart the container:

```bash
open -a Docker # macOS only; wait until Docker Desktop says it is running
docker compose ps
docker compose up -d --wait votiy-database votiy-database-init
docker compose logs --tail=50 votiy-database
```

Wait for the container status to show `healthy`, then restart `pnpm dev` in `votiy-api`. Verify the
database directly with:

```bash
docker compose exec votiy-database mongosh \
  "mongodb://root:localpassword@127.0.0.1:27017/admin?replicaSet=rs0&directConnection=true" \
  --eval "db.adminCommand('hello').isWritablePrimary"
```

The command must print `true`. See the replica-set recovery runbook in
[docs/operations.md](./docs/operations.md) if it does not.

If the error changes to `Authentication failed`, recopy `.env.example` to `.env.local` or update the
existing `MONGODB_URI` to the Compose connection string shown above. Do not use these local credentials
in production.

Run quality gates:

```bash
pnpm --dir votiy-api test:coverage
pnpm --dir votiy-web test:coverage
pnpm --dir votiy-api test:integration
pnpm test:e2e --project=chromium
pnpm test:e2e --project=mobile-chromium --grep "responsive|public shell"
```

Migration 005 adds closed-by-default voting rules, encrypted one-time codes, voter access, and immutable
ballots. Local startup runs migrations automatically. Set `VOTING_CODE_ENCRYPTION_KEY` to 64 hexadecimal
characters (32 bytes); changing or losing it makes existing code inventory unreadable. Generated batches
accept 1–1,000 codes, with at most 100,000 codes per event.

For test-only accounts, you can bypass email delivery while still exercising the verification flow by
setting `VERIFICATION_BYPASS_EMAILS` or `VERIFICATION_BYPASS_DOMAINS` in `votiy-api/.env.local`. When a
registration matches that allowlist, the register screen shows the verification token instead of sending
an email.

## Production

Render builds React and serves it from the Node API. Set these secret environment variables in Render:

- `MONGODB_URI`: MongoDB Atlas connection string for the restricted application user
- `NODE_ENV`: `production`
- `TOKEN_PEPPER`
- `VOTING_CODE_ENCRYPTION_KEY`: stable 64-character hexadecimal secret; generate once and retain it
- `EMAIL_PROVIDER_ENDPOINT` and `EMAIL_PROVIDER_API_KEY` when using real provider delivery

For temporary MVP deployments without a real email provider, production can run with
`EMAIL_TRANSPORT=fake`. In that mode, verification emails are not sent externally; the API logs the
verification link and token so you can complete the flow manually from Render logs.

Render service config lives in [render.yaml](./render.yaml). It now uses `/ready` for health gating and
declares app origin, cookie name, token TTLs, and log level without committing secret values.

Voting logs contain counters, timings, correlation IDs, and safe error codes only. Raw voting codes,
contacts, ballot choices/ranks, and browser markers are redacted. Browser-limited unrestricted voting is
a lightweight deterrent, not strong identity enforcement: clearing browser storage can permit another vote.

The service exposes `/health` for health checks and `/graphql` for same-origin requests from the application.

## Event setup workflow

Event hosts use one primary **Add** button beside Event Settings on Entries, Participants, and Results.
Choose **Category** to create a category. Choose **Entry** to select an active category, select or create
its owner account, and enter the entry title. Entry creation defaults to the event category marked
`isDefault`; display order never determines the default.

Participants are derived from active entry ownership. Participant cards and removal remain available, but
there is no separate Add Participant form. Existing direct participant API operations remain temporarily
for backward compatibility and are not exposed by the current web UI.

## Find Events and visibility

The shared header exposes **Find events** for signed-in and signed-out visitors. Search matches
case-insensitive middle-of-word terms across event title, description, and location. Active public and
private events appear; unlisted and archived events do not. Results load 20 at a time and continue through
infinite scroll or the keyboard-accessible **Load more events** button.

Hosts control visibility from Event Settings:

- **Public**: searchable with normal public details.
- **Private**: searchable, but non-hosts receive only title, description, analytics counts, navigation
  labels, and the private-event notice.
- **Unlisted**: excluded from search but available by direct link.
- **Archived**: irreversible, excluded from search, host-only, and read-only.

The API evaluates viewer ownership on every `/events/:publicId` request. A host always receives the full
host view, including when arriving from search. Start local MongoDB first, then validate Feature 010 with:

```bash
pnpm --dir votiy-api test
pnpm --dir votiy-web test
pnpm --dir votiy-web build
pnpm test:e2e tests/e2e/find-events-search.spec.js
```

## Production smoke

Post-deploy smoke workflow hits:

- `/health`
- `/ready`
- public home page
- optional synthetic public event path
- deployed commit header when available

With all `PRODUCTION_SYNTHETIC_*` variables set, smoke also validates legacy event setup plus voting-rule
update, code generation, ballot submission, used-code inventory, and reuse denial. Alert when rules,
eligibility, or ballot p95 exceeds two seconds, voting errors exceed 5%, migration readiness fails, an
event invariant fails, or code-claim conflicts spike. Correlate diagnostics by `correlationId`; never paste
codes or voter contact into logs.

Set the CI-only secret `PRODUCTION_SMOKE_MONGODB_URI` (and optionally
`PRODUCTION_SMOKE_MONGODB_DATABASE`) to verify the three synthetic voting audits directly without
exposing an audit query through the public API.

### Voting rollback

On a failed deployment, roll back the application to the prior tested commit and retain migration 005.
Do not delete or rewrite voting rules, codes, voter-access grants, ballots, idempotency records, or audits.
Keep `VOTING_CODE_ENCRYPTION_KEY` unchanged. Confirm `/ready`, rerun production smoke, then inspect
structured migration, invariant, and claim-conflict events before restoring traffic.
# Event photos

Event hosts can upload one JPEG, PNG, or WebP photo per event. The API—not the browser—validates and
compresses input. Uploads are limited to 10 MiB and 40 megapixels, normalized to a metadata-free square
WebP no larger than 640×640 and 350 KiB, using quality 80, 70, then 60. Production requires Sharp's native
module to load during CI/Render installation. Photo documents live in the additive `eventPhotos`
collection; rollback must retain that collection because older releases safely ignore it.
