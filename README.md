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

For test-only accounts, you can bypass email delivery while still exercising the verification flow by
setting `VERIFICATION_BYPASS_EMAILS` or `VERIFICATION_BYPASS_DOMAINS` in `votiy-api/.env.local`. When a
registration matches that allowlist, the register screen shows the verification token instead of sending
an email.

## Production

Render builds React and serves it from the Node API. Set these secret environment variables in Render:

- `MONGODB_URI`: MongoDB Atlas connection string for the restricted application user
- `NODE_ENV`: `production`
- `TOKEN_PEPPER`
- `EMAIL_PROVIDER_ENDPOINT` and `EMAIL_PROVIDER_API_KEY` when using real provider delivery

For temporary MVP deployments without a real email provider, production can run with
`EMAIL_TRANSPORT=fake`. In that mode, verification emails are not sent externally; the API logs the
verification link and token so you can complete the flow manually from Render logs.

Render service config lives in [render.yaml](./render.yaml). It now uses `/ready` for health gating and
declares app origin, cookie name, token TTLs, and log level without committing secret values.

The service exposes `/health` for health checks and `/graphql` for same-origin requests from the application.

## Production smoke

Post-deploy smoke workflow hits:

- `/health`
- `/ready`
- public home page
- optional synthetic public event path
- deployed commit header when available
