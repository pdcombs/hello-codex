# Hello Codex

A small three-tier application with a React frontend, GraphQL API, and MongoDB database.

## Local development

Start MongoDB:

```bash
docker compose up -d
```

Start the API from `hello-world-api`:

```bash
pnpm install
pnpm dev
```

Start React from `hello-world`:

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>.

## Production

Render builds React and serves it from the Node API. Set these secret environment variables in Render:

- `MONGODB_URI`: MongoDB Atlas connection string for the restricted application user
- `NODE_ENV`: `production`

The service exposes `/health` for health checks and `/graphql` for same-origin requests from the application.
