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

## Local development

Start MongoDB:

```bash
docker compose up -d
```

Start the Votiy API:

```bash
cd votiy-api
pnpm install
cp .env.example .env.local
pnpm dev
```

Start the Votiy React web app in another terminal:

```bash
cd votiy-web
pnpm install
pnpm dev
```

Open <http://127.0.0.1:5173>.

For test-only accounts, you can bypass email delivery while still exercising the verification flow by
setting `VERIFICATION_BYPASS_EMAILS` or `VERIFICATION_BYPASS_DOMAINS` in `votiy-api/.env.local`. When a
registration matches that allowlist, the register screen shows the verification token instead of sending
an email.

## Production

Render builds React and serves it from the Node API. Set these secret environment variables in Render:

- `MONGODB_URI`: MongoDB Atlas connection string for the restricted application user
- `NODE_ENV`: `production`

For temporary MVP deployments without a real email provider, production can run with
`EMAIL_TRANSPORT=fake`. In that mode, verification emails are not sent externally; the API logs the
verification link and token so you can complete the flow manually from Render logs.

The existing Render service name and production MongoDB database remain unchanged during this repository
rename. Local development reads `MONGODB_DATABASE=votiy` from the ignored `votiy-api/.env.local` file;
production continues to use `hello_world` because that local file is never committed or deployed.

The service exposes `/health` for health checks and `/graphql` for same-origin requests from the application.
