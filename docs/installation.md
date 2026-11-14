# Installation

## Requirements

| Requirement | Version |
| --- | --- |
| Node.js | 20.9+ (22.x recommended; the app is tested on 22) |
| npm | 10 or newer |
| PostgreSQL | 14+ (Neon, Supabase, or local) |
| Git | any recent version |

## 1. Clone

```bash
git clone https://github.com/NotOpgamer404YT/Fury-Agent.git
cd Fury-Agent
npm install
```

## 2. Create the database

Create a PostgreSQL database. For local development:

```bash
createdb fury_agent
```

Or use a free Neon project and copy the pooled connection string.

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Generate the two secrets:

```bash
# AUTH_SECRET — signs session cookies
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# ENCRYPTION_KEY — encrypts provider keys at rest (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Fill in `DATABASE_URL`, `AUTH_SECRET` and `ENCRYPTION_KEY`. Everything else can wait.

## 4. Run migrations

```bash
npm run db:generate   # generate SQL from the Drizzle schema
npm run db:migrate    # apply migrations to DATABASE_URL
```

## 5. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>, register an account, then visit **Providers** to add your first AI provider.

## Development without a database

If `DATABASE_URL` is unset, the app falls back to an **in-memory store** for UI exploration. Data is lost on restart, and this mode is **not for production** — the dashboard shows the same code paths, so it is useful for design work and demos only.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Vitest suite |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:migrate` | Apply migrations |
| `npm run db:studio` | Drizzle Studio |

## Troubleshooting first run

- **`ENCRYPTION_KEY is not configured`** — provider saving is blocked until the key exists.
- **Tables missing** — you skipped `db:migrate`.
- **Login redirects to /login repeatedly** — `AUTH_SECRET` changed between restarts; delete cookies and sign in again.
