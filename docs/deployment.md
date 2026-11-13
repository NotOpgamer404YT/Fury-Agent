# Vercel Deployment

## One-click clone

Use the **Deploy to Vercel** button in the README, or:

```
https://vercel.com/new/clone?repository-url=https://github.com/NotOpgamer404YT/Fury-Agent
```

You will be prompted for the environment variables below. **You must supply your own database and secrets** — the upstream project ships no credentials.

## Required environment variables

```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=<32 random bytes>
ENCRYPTION_KEY=<64 hex chars>
APP_URL=https://your-app.vercel.app
```

Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (then set the callback URL to `{APP_URL}/api/v1/github/callback`).

## Database setup

1. Create a project at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the **pooled** connection string (Neon: host contains `-pooler`; Supabase: port 6543).
3. Run migrations against it from your machine:

```bash
DATABASE_URL="postgresql://…" npm run db:generate
DATABASE_URL="postgresql://…" npm run db:migrate
```

Migrations are a build-time/manual step. Running drizzle-kit during the Vercel build is possible but discouraged: concurrent deploys can race. Apply migrations once per schema change.

## Function duration

`vercel.json` sets `maxDuration: 60` for the step and chat routes. The default Vercel plan allows up to 60 s for Node functions on Hobby and more on Pro. If your plan caps lower, lower these values — the app reads them from `vercel.json` only.

Because every step is bounded and checkpointed, a shorter duration degrades throughput, not correctness: the client simply makes more step requests.

## Post-deploy checklist

- [ ] `/api/v1/health` reports database **configured** and encryption **configured**.
- [ ] Register an account and sign in.
- [ ] Add a provider, click **Test** and confirm success.
- [ ] Connect GitHub and import a repository.
- [ ] Run an ASK task (read-only), then an AGENT task with an approval pause.
- [ ] Open the editor, edit a file, commit it, verify the commit on GitHub.

## Cold starts

Serverless cold starts add latency to the first step. Providers with fast first-token times (Groq, Cerebras) feel best. Nothing breaks.

## Storage

`VERCEL_BLOB_READ_WRITE_TOKEN` is optional and reserved for artifacts. The database never depends on local disk, and no feature requires Blob storage today.
