<div align="center">

# ⚡ Fury Agent

**An open-source, self-hostable AI coding agent platform.**
Ask, plan and ship real changes to your own GitHub repositories — with your own AI keys.

[![License: MIT](https://img.shields.io/badge/License-MIT-8B5CF6.svg)](LICENSE)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NotOpgamer404YT/Fury-Agent)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791)

[Documentation](https://github.com/NotOpgamer404YT/Fury-Agent/tree/main/docs) · [Report a bug](https://github.com/NotOpgamer404YT/Fury-Agent/issues) · [Contributing](CONTRIBUTING.md)

</div>

---

## What it is

Fury Agent is a Vercel-first, serverless AI development platform. You deploy **your own instance**, connect **your own** PostgreSQL database, AI provider keys and GitHub account. No shared keys, no subscription, no vendor proxy.

- **ASK** — explain code, answer questions, read repository files. Read-only.
- **PLAN** — analyse a project, produce an implementation plan with affected files and risks. Read-only.
- **AGENT** — multi-step coding: read files, generate patches, commit to a branch, open a pull request. Write tools require your approval.

## Highlights

| | |
| --- | --- |
| **Hardened dependencies** | Next.js 16, React 19.3, Drizzle 0.45, Zod 4 — `npm audit` reports zero high/critical findings, and CI fails on new high-severity production advisories. |
| **Serverless agent engine** | Persistent state machine with bounded steps, database checkpoints, resume, cancel and approval gates. No daemons, no Docker, no VPS. |
| **Real GitHub integration** | REST + Git Database APIs: repo listing, file tree, file read/write, branches, blob→tree→commit, compare, pull requests. |
| **Bring your own AI** | Google Gemini (native adapter) and any OpenAI-compatible endpoint: Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute, custom. Role-based model selection with priority fallback. |
| **Encrypted credentials** | AES-256-GCM at rest with your `ENCRYPTION_KEY`. Keys are never returned by the API, never logged, never sent to the model. |
| **CodeMirror 6 editor** | Multi-tab editing, syntax highlighting, search/replace, diff preview, font sizing, GitHub-backed commits. |
| **Streaming replies** | ASK/PLAN answers stream token-by-token and are persisted with usage; AGENT turns stay in the audited step loop. |
| **Production-minded security** | bcrypt, DB-backed sessions, per-user ownership filters, Zod validation, rate limiting, path-traversal protection, audit tables. |
| **Honest limits** | No shell, no test execution inside Vercel Functions, no in-memory queues. Documented instead of faked. |

## Screenshots

The landing page includes a product preview; the dashboard, agent task view and editor are live after you deploy.

## Quick start (local)

```bash
git clone https://github.com/NotOpgamer404YT/Fury-Agent.git
cd Fury-Agent
npm install
cp .env.example .env.local

# generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"  # AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"        # ENCRYPTION_KEY

npm run db:generate && npm run db:migrate
npm run dev
```

Open <http://localhost:3000>, register, then add a provider under **Providers**.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NotOpgamer404YT/Fury-Agent)

1. Create a PostgreSQL database (**Neon** or **Supabase**) and copy the pooled `DATABASE_URL`.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY` and `APP_URL` in Vercel.
3. Run `npm run db:migrate` once against that database.
4. Optionally add `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` with callback `{APP_URL}/api/v1/github/callback`.
5. Open `/api/v1/health` to confirm configuration.

Full walkthrough: [docs/deployment](docs/deployment.md).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Session cookie signing key |
| `ENCRYPTION_KEY` | ✅ | AES-256-GCM key for stored credentials |
| `APP_URL` | recommended | Public origin for OAuth redirects |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional | Enables GitHub OAuth |
| `GITHUB_APP_ID` / `GITHUB_PRIVATE_KEY` | optional | Reserved for GitHub App installations |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | optional | Optional object storage |

Provider API keys are **never** environment variables — each user stores their own in the UI.

## Architecture

```
Browser (Next.js App Router)
   │  /api/v1/*   (auth → rate limit → Zod → ownership)
   ├── lib/auth            JWT cookie + sessions table
   ├── lib/encryption      AES-256-GCM
   ├── server/providers    Gemini + OpenAI-compatible adapters
   ├── server/tools        14-tool registry (read/write/git) + path safety
   ├── server/agents       persistent state machine (one bounded step per request)
   └── lib/github          REST + Git Database API
        │
    PostgreSQL (Drizzle ORM)
```

More: [docs/architecture](docs/architecture.md).

## Project structure

```
src/
  app/(public)      landing
  app/(auth)        login, register
  app/(dashboard)   dashboard, projects, tasks, providers, github, editor, approvals, settings
  app/docs          documentation portal
  app/api/v1        versioned REST API
  components/       ui, layout, agent, editor, docs, projects, settings
  features/         providers, github, projects, tasks
  lib/              auth, database, encryption, github, validation, rate-limit
  server/           agents, providers, tools, memory, tasks, orchestration
drizzle/            SQL migrations
tests/              Vitest suites
docs/               Markdown documentation
```

## API (v1)

`POST /api/v1/auth/{register,login,logout}` · `GET|POST /api/v1/projects` · `GET|POST /api/v1/providers` · `POST /api/v1/providers/{id}/test` · `GET /api/v1/models` · `GET /api/v1/github/repositories` · `POST /api/v1/github/{connect,import}` · `POST|GET /api/v1/tasks` · `POST /api/v1/tasks/{id}/{step,stream,approve,cancel,resume}` · `GET|POST /api/v1/tasks/{id}/messages` · `GET /api/v1/tasks/{id}/events`

See [docs/api-reference](docs/api-reference.md).

## Testing

```bash
npm run typecheck   # TypeScript strict
npm test            # Vitest: auth, encryption, providers, tools, paths, task state, agent loop, RTL components
npm audit --omit=dev --audit-level=high  # dependency gate (also enforced in CI)
npm run build       # production build

# Optional end-to-end (needs browsers installed locally):
npx playwright install --with-deps
npm run test:e2e
```

The Playwright suite is opt-in: it requires browser binaries and a running instance. CI runs typecheck, Vitest and the production build.

## Known limitations (by design)

- **No shell execution.** Vercel Functions offer no persistent shell. Repository edits go through the GitHub API. An `ExecutionProvider` interface exists for wiring an external runner; it ships empty and disabled.
- **Tests are not executed.** GitHub Actions status is displayed when workflows exist; otherwise the UI states that tests were not run.
- **No database in dev?** The in-memory fallback shares state across route handlers and server components within one Node process via a `globalThis` singleton, so the preview works — it is still ephemeral, single-process and not for production.
- **Stepping, not background jobs.** A task advances when the client calls `/step`. Progress is checkpointed, so reloads, timeouts and failures are recoverable.
- **In-memory rate limiting.** Per-instance only; move counters to PostgreSQL for multi-instance quotas.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security issues: [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Fury Agent contributors.
