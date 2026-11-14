export type DocPage = { slug: string; title: string; description: string; body: string };

export const DOCS: DocPage[] = [
  {
    slug: "", title: "Introduction",
    description: "What Fury Agent is, how it works and who it is for.",
    body: `# Fury Agent

Fury Agent is an **open-source AI coding agent platform you deploy yourself**. It turns your own GitHub repositories into an agent workspace: you connect your own AI provider keys, import repositories, and let the agent read files, generate patches, commit to branches and open pull requests.

## Why self-hosted

- **Your keys.** No shared provider accounts, no metered proxy. Every credential belongs to your instance.
- **Your data.** Users, sessions, tasks and provider configs live in *your* PostgreSQL database.
- **Your code.** MIT licensed. Fork it, extend the tool registry, rebrand it.

## What it does

| Mode | Capability |
| --- | --- |
| **Ask** | Explain code, answer questions, read repository files. Read-only. |
| **Plan** | Analyse a project, produce an implementation plan, identify affected files and risks. Read-only. |
| **Agent** | Multi-step coding tasks: read, edit, generate patches, commit to a branch, open a PR. Write tools require approval. |

## Architecture in one minute

1. A **Next.js App Router** application serves the marketing site, docs, dashboard and a versioned REST API (\`/api/v1/*\`).
2. **PostgreSQL + Drizzle ORM** persist users, sessions, projects, provider configs, tasks, task events, messages, tool executions, approvals and usage.
3. **Server-side provider adapters** talk to Gemini (native API) and any OpenAI-compatible endpoint (Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute, custom).
4. The **agent engine** is a persistent state machine. Each invocation performs **one bounded step**, writes a checkpoint, and returns. The browser polls the step endpoint until the task reaches a terminal state.
5. **Repository tools** operate over the GitHub REST and Git Database APIs. There is no shell, no Docker and no persistent process.

## Honest limitations

Fury Agent refuses to pretend. These are documented, by design:

- **No shell execution.** Vercel Functions do not provide a persistent Linux shell, so the agent cannot run build or test commands directly. A future \`ExecutionProvider\` interface exists (disabled by default) for wiring an external execution service.
- **Tests are not run.** If your repository has GitHub Actions workflows, Fury Agent can display their status. If no workflow exists it reports that tests were not executed.
- **Serverless stepping.** Long tasks are not background jobs. A task advances when the client calls \`/step\`; progress is checkpointed so you can resume after a reload, a timeout, or a failure.

## Next steps

- [Installation](/docs/installation) — run it locally in five minutes
- [Configuration](/docs/configuration) — environment variables explained
- [Providers](/docs/providers) — connect your own AI keys
- [Deployment](/docs/deployment) — ship to Vercel`,
  },
  {
    slug: "installation", title: "Installation",
    description: "Clone, configure and run Fury Agent locally.",
    body: `# Installation

## Requirements

| Requirement | Version |
| --- | --- |
| Node.js | 22.x (pinned in \`engines\`; required by the Vitest 5 / jsdom 31 test toolchain and used by CI + Vercel) |
| npm | 10 or newer |
| PostgreSQL | 14+ (Neon, Supabase, or local) |
| Git | any recent version |

## 1. Clone

\`\`\`bash
git clone https://github.com/NotOpgamer404YT/Fury-Agent.git
cd Fury-Agent
npm install
\`\`\`

## 2. Create the database

Create a PostgreSQL database. For local development:

\`\`\`bash
createdb fury_agent
\`\`\`

Or use a free Neon project and copy the pooled connection string.

## 3. Configure environment variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Generate the two secrets:

\`\`\`bash
# AUTH_SECRET — signs session cookies
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# ENCRYPTION_KEY — encrypts provider keys at rest (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

Fill in \`DATABASE_URL\`, \`AUTH_SECRET\` and \`ENCRYPTION_KEY\`. Everything else can wait.

## 4. Run migrations

\`\`\`bash
npm run db:generate   # generate SQL from the Drizzle schema
npm run db:migrate    # apply migrations to DATABASE_URL
\`\`\`

## 5. Start the dev server

\`\`\`bash
npm run dev
\`\`\`

Open <http://localhost:3000>, register an account, then visit **Providers** to add your first AI provider.

## Development without a database

If \`DATABASE_URL\` is unset, the app falls back to an **in-memory store** for UI exploration. Data is lost on restart, and this mode is **not for production** — the dashboard shows the same code paths, so it is useful for design work and demos only.

## Useful scripts

| Script | Purpose |
| --- | --- |
| \`npm run dev\` | Development server |
| \`npm run build\` | Production build |
| \`npm run typecheck\` | TypeScript strict check |
| \`npm test\` | Vitest suite |
| \`npm run db:generate\` | Generate migration SQL |
| \`npm run db:migrate\` | Apply migrations |
| \`npm run db:studio\` | Drizzle Studio |

## Troubleshooting first run

- **\`ENCRYPTION_KEY is not configured\`** — provider saving is blocked until the key exists.
- **Tables missing** — you skipped \`db:migrate\`.
- **Login redirects to /login repeatedly** — \`AUTH_SECRET\` changed between restarts; delete cookies and sign in again.`,
  },
  {
    slug: "configuration", title: "Configuration",
    description: "Every environment variable, what it does and whether it is required.",
    body: `# Configuration

All configuration is through environment variables. Only three are required.

## Required

| Variable | Purpose |
| --- | --- |
| \`DATABASE_URL\` | PostgreSQL connection string (Neon/Supabase pooled URL recommended). |
| \`AUTH_SECRET\` | Signs session cookies (JWT HS256). Use 32 random bytes. Rotating it invalidates all sessions. |
| \`ENCRYPTION_KEY\` | AES-256-GCM master key for provider API keys and GitHub tokens. 64 hex chars, 32 base64 bytes, or a passphrase (SHA-256 derived). |

## Recommended

| Variable | Purpose |
| --- | --- |
| \`APP_URL\` | Public origin, e.g. \`https://fury.example.com\`. Used for OAuth redirect URIs. |

## Optional

| Variable | Purpose |
| --- | --- |
| \`GITHUB_CLIENT_ID\` | GitHub OAuth App client ID. Enables the GitHub integration. |
| \`GITHUB_CLIENT_SECRET\` | GitHub OAuth App client secret. |
| \`GITHUB_APP_ID\` | Reserved for GitHub App installations (see [/docs/github](/docs/github)). |
| \`GITHUB_PRIVATE_KEY\` | Reserved for GitHub App private key (PEM, newline-escaped). |
| \`VERCEL_BLOB_READ_WRITE_TOKEN\` | Optional object storage for large artifacts. |

> Provider API keys are **not** application-wide variables. Each user stores their own keys through the Providers UI, encrypted with \`ENCRYPTION_KEY\`.

## Rotating secrets

1. **AUTH_SECRET** — set the new value, deploy. Existing sessions become invalid; users sign in again.
2. **ENCRYPTION_KEY** — rotation requires re-encryption, because stored ciphertext is bound to the old key. Procedure: keep the old key mounted as \`ENCRYPTION_KEY_OLD\`, add a small script that decrypts with the old key and re-encrypts with the new one, run it against \`provider_configs.api_key_encrypted\` and \`github_connections.access_token_encrypted\`, then remove the old key. Never rotate without a backup.

## Dependency security

Vercel blocks deploys that ship a known-vulnerable Next.js build, so treat upgrades as part of maintenance:

\`\`\`bash
npm audit --omit=dev --audit-level=high   # production dependency gate (runs in CI)
npm audit                                 # full tree, including dev tooling
\`\`\`

The project tracks the latest patched releases: **Next.js 16.4**, React 19.3, Drizzle ORM 0.45, Zod 4.
If your fork pins older versions, expect the Vercel security gate to reject the build — upgrade instead of
bypassing it.

Runtime dependencies currently report **no advisories** (\`npm audit --omit=dev\` → 0 vulnerabilities). The full
tree may still show a few **moderate, development-only** findings inside \`drizzle-kit\`'s legacy \`@esbuild-kit\`
loader, which never reaches a deployed function. They are tracked rather than hidden.

## Security rules

- Never prefix secrets with \`NEXT_PUBLIC_\`. Those values are compiled into client JavaScript.
- Never commit \`.env\` files. \`.gitignore\` already excludes \`.env*\`.
- Encrypted values are never returned by the API: provider responses expose only \`hasApiKey: true/false\`.`,
  },
  {
    slug: "architecture", title: "Architecture",
    description: "How the app, agent engine, database and GitHub layer fit together.",
    body: `# Architecture

## Layers

\`\`\`
Browser (Next.js App Router, RSC + client components)
  │  fetch /api/v1/*
Next.js Route Handlers  (auth, rate limits, Zod validation, ownership checks)
  │
  ├── lib/auth            sessions (JWT cookie + DB session rows)
  ├── lib/encryption      AES-256-GCM for credentials
  ├── lib/database        Drizzle schema + lazy postgres.js client
  ├── server/providers    Gemini native + OpenAI-compatible adapters
  ├── server/tools        tool registry (14 repository tools)
  ├── server/agents       persistent agent state machine
  └── lib/github          REST + Git Database API client
        │
     PostgreSQL
\`\`\`

## The agent loop

The specification calls for a 12-step loop. Fury Agent implements it as **bounded, resumable steps**:

1. Receive task (row in \`tasks\`, status \`pending\`).
2. Load project context (project row, instructions, branch).
3. Retrieve relevant repository files (tool calls, not full clones).
4. Generate an execution plan (PLAN/AGENT mode: model composes a plan; events are recorded).
5. Select an AI model (\`default\`/\`coding\`/\`planning\`/\`review\` role, priority ordering).
6. Request tool calls from the model.
7. Validate tool permissions (mode gating + Zod schema + path safety).
8. Execute the tool through the GitHub API.
9. Return results to the model as \`tool\` messages.
10. Continue: the next \`/step\` call resumes from the checkpoint.
11. Review: status moves to \`reviewing\`.
12. Save results: messages, events, tool executions, usage, task state.

Each call performs **one** model round-trip plus any tool calls it requested, then persists everything. Nothing depends on the function staying alive.

## Statuses

\`pending → planning → running → waiting_approval → running → reviewing → completed\`, with \`failed\` and \`cancelled\` reachable from most states and \`resume\` available afterwards.

## Sessions

The session cookie is an HS256 JWT carrying the user id and a session id (\`sid\`). The database row is
authoritative: \`getSessionUser\` verifies the JWT, then loads the session row and rejects it if it is missing
or expired. Logout and account deletion delete the row, so sessions are genuinely revocable rather than
"valid until the token expires".

## Retries

\`stepWithRetry\` retries transport-shaped failures (timeouts, DNS/connection errors, HTTP 429/5xx) a bounded
number of times, clearing the terminal status between attempts. Business outcomes — approval pauses, invalid
tool arguments, permission denials — are never retried. The attempt count is returned with each step result.

## Concurrency control

\`tasks.locked_at\` acts as a lease. A step refuses to start if another invocation holds a lock younger than five minutes. This prevents duplicate execution from overlapping polls.

## Provider fallback

Providers carry a \`priority\` and role flags. Selection order: explicit task provider → role flag (\`isCoding\`/\`isPlanning\`/\`isReview\`/\`isDefault\`) → lowest priority among enabled providers. Failed calls surface as task errors; configure a second provider with a higher priority number to act as a fallback.

## Why no shell

Arbitrary code execution in a multi-tenant serverless environment is a security and product risk. Fury Agent edits repositories through the GitHub API instead — auditable, reviewable, and reversible. The \`ExecutionProvider\` interface in \`src/server/tools/index.ts\` defines the seam for adding an external execution service later; it ships empty and disabled.`,
  },
  {
    slug: "providers", title: "AI Providers",
    description: "Configure Gemini, Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute or any OpenAI-compatible endpoint.",
    body: `# AI Providers

Every user brings their own keys. Nothing is shared with the Fury Agent maintainers, and no endpoint is privileged.

## Adding a provider

1. Go to **Providers → Add provider**.
2. Pick a preset (it fills the base URL) or choose *Custom*.
3. Paste your API key and the model ID.
4. Describe the endpoint honestly:
   - **Tool calling** — enable only if the provider returns OpenAI-style \`tool_calls\`. Without it, AGENT mode degrades to text-only planning.
   - **Streaming** — enable if \`stream: true\` is supported; otherwise Fury falls back to non-streaming completions.
5. Set priority (lower wins) and optionally mark it as default / coding / planning / review.

## Presets

| Provider | Base URL | Notes |
| --- | --- | --- |
| FreeLLMAPI | \`https://api.freellmapi.com/v1\` | Aggregator; verify the current base URL in their docs. |
| OmniRoute | \`https://api.omniroute.ai/v1\` | Aggregator; verify the current base URL. |
| Google Gemini | \`https://generativelanguage.googleapis.com/v1beta\` | Native \`generateContent\` adapter, \`?key=\` auth. |
| Groq | \`https://api.groq.com/openai/v1\` | OpenAI-compatible, fast inference. |
| Cerebras | \`https://api.cerebras.ai/v1\` | OpenAI-compatible. |
| OpenRouter | \`https://openrouter.ai/api/v1\` | OpenAI-compatible, many models. |
| Custom | your URL | Any OpenAI-compatible \`/chat/completions\`. |

> **No free tier is guaranteed.** Aggregators change quotas, models and base URLs without notice. Fury never advertises "free forever" access — test the connection and check the provider's own terms.

## Testing and model discovery

**Test** performs a \`GET /models\` (or Gemini's \`/models\`) call and reports status. **Fetch models** lists what the endpoint advertises. If discovery is unsupported, type the model ID manually — this is expected for some gateways.

## Adapters

- \`openai-compatible\` family: \`POST {baseUrl}/chat/completions\`, \`Authorization: Bearer\`.
- \`gemini\`: \`POST {baseUrl}/models/{model}:generateContent?key=...\` with \`systemInstruction\` + \`contents\`.

Both normalise to \`{ content, promptTokens, completionTokens, toolCalls? }\`.

## Security

- Keys are encrypted with AES-256-GCM before insert.
- API responses expose \`hasApiKey\` only — never the key, never the ciphertext.
- Keys are never logged, never embedded in client bundles, and never sent to the model.
- Deleting a provider nulls the reference on historical tasks; usage rows are retained without credentials.

## Request behaviour

- Per-provider timeout (\`timeoutMs\`, default 60 s) via \`AbortController\`.
- Temperature is stored as text to preserve decimals exactly.
- Token usage is recorded per call in \`model_usage\`, aggregated on the dashboard.`,
  },
  {
    slug: "github", title: "GitHub Setup",
    description: "Create an OAuth App, connect it, and understand the permission model.",
    body: `# GitHub Setup

Fury Agent uses **GitHub OAuth** with the minimum practical scopes: \`repo\` and \`read:user\`.

## 1. Create an OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: your \`APP_URL\`.
3. Authorization callback URL: \`{APP_URL}/api/v1/github/callback\`.
4. Copy the **Client ID** and generate a **Client Secret**.

\`\`\`bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
APP_URL=https://your-instance.vercel.app
\`\`\`

## 2. Connect in the UI

Go to **GitHub → Connect GitHub**. The flow:

1. \`POST /api/v1/github/connect\` returns the authorize URL and sets an httpOnly \`state\` cookie.
2. GitHub redirects to \`/api/v1/github/callback\`.
3. The callback verifies \`state\`, exchanges the code for a token, reads \`/user\`, and stores the token **encrypted** in \`github_connections\`.

## 3. Import a repository

**GitHub → Import** creates a \`projects\` row plus a \`repositories\` row. The project carries owner, repo and default branch, which every agent tool uses.

## Scopes and permissions

| Scope | Why |
| --- | --- |
| \`repo\` | Read private repositories, create branches, commit, open PRs. |
| \`read:user\` | Display the connected GitHub login. |

Tokens are decrypted **server-side only**, never returned through an API, and never placed in a model prompt. The agent sees tool *results*, not credentials.

## Write safety

- All mutating tools are marked \`needsApproval\`. In AGENT mode a task pauses at \`waiting_approval\` and only continues when you approve in the UI.
- \`assertSafePath\` blocks \`..\`, absolute paths, null bytes and \`.git/\` access on every filesystem-shaped tool.
- Nothing is force-pushed. Commits are appended to a task branch; PRs are opened from that branch.
- Never commit directly to a protected branch without explicit approval — the default flow creates a branch first via \`create_branch\`.

## GitHub App (optional, future)

\`GITHUB_APP_ID\` and \`GITHUB_PRIVATE_KEY\` are reserved for installation tokens (finer-grained, per-repository permissions). The OAuth App path is fully implemented; the App path is documented as the supported next step for organisations that require installation-scoped access. Do not set these variables expecting behaviour that does not exist yet.

## Workflow status

Fury can list Actions workflows and runs for a repository. If no workflow exists, the UI reports **tests were not executed** — it never fabricates a green check.`,
  },
  {
    slug: "deployment", title: "Vercel Deployment",
    description: "Deploy your own Fury Agent instance to Vercel with a Neon or Supabase database.",
    body: `# Vercel Deployment

## One-click clone

Use the **Deploy to Vercel** button in the README, or:

\`\`\`
https://vercel.com/new/clone?repository-url=https://github.com/NotOpgamer404YT/Fury-Agent
\`\`\`

You will be prompted for the environment variables below. **You must supply your own database and secrets** — the upstream project ships no credentials.

## Required environment variables

\`\`\`bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=<32 random bytes>
ENCRYPTION_KEY=<64 hex chars>
APP_URL=https://your-app.vercel.app
\`\`\`

Optional: \`GITHUB_CLIENT_ID\`, \`GITHUB_CLIENT_SECRET\` (then set the callback URL to \`{APP_URL}/api/v1/github/callback\`).

## Database setup

1. Create a project at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the **pooled** connection string (Neon: host contains \`-pooler\`; Supabase: port 6543).
3. Run migrations against it from your machine:

\`\`\`bash
DATABASE_URL="postgresql://…" npm run db:generate
DATABASE_URL="postgresql://…" npm run db:migrate
\`\`\`

Migrations are a build-time/manual step. Running drizzle-kit during the Vercel build is possible but discouraged: concurrent deploys can race. Apply migrations once per schema change.

## Function duration

\`vercel.json\` sets \`maxDuration: 60\` for the step and chat routes. The default Vercel plan allows up to 60 s for Node functions on Hobby and more on Pro. If your plan caps lower, lower these values — the app reads them from \`vercel.json\` only.

Because every step is bounded and checkpointed, a shorter duration degrades throughput, not correctness: the client simply makes more step requests.

## Security gate on Vercel

Vercel inspects your dependency tree during the build and blocks deployment when it detects a vulnerable
Next.js version ("Vulnerable version of Next.js detected"). Fury Agent tracks patched releases, so keep
\`package-lock.json\` committed and do not downgrade. If a build is blocked after upgrading, clear the Vercel
build cache and redeploy.

## Post-deploy checklist

- [ ] \`/api/v1/health\` reports database **configured** and encryption **configured**.
- [ ] Register an account and sign in.
- [ ] Add a provider, click **Test** and confirm success.
- [ ] Connect GitHub and import a repository.
- [ ] Run an ASK task (read-only), then an AGENT task with an approval pause.
- [ ] Open the editor, edit a file, commit it, verify the commit on GitHub.

## Cold starts

Serverless cold starts add latency to the first step. Providers with fast first-token times (Groq, Cerebras) feel best. Nothing breaks.

## Storage

\`VERCEL_BLOB_READ_WRITE_TOKEN\` is optional and reserved for artifacts. The database never depends on local disk, and no feature requires Blob storage today.`,
  },
  {
    slug: "security", title: "Security",
    description: "Threat model, controls, and what you must do when self-hosting.",
    body: `# Security

## Controls implemented

| Area | Control |
| --- | --- |
| Passwords | bcrypt, cost 12. Never logged, never returned. |
| Sessions | HS256 JWT in an httpOnly, SameSite=Lax cookie (7 days) carrying a \`sid\`; the \`sessions\` row is authoritative, so logout revokes immediately and expired rows are rejected. |
| Route protection | \`src/proxy.ts\` (Next.js 16 Proxy, formerly middleware) redirects unauthenticated page requests; every private handler calls \`requireUser()\`. |
| Ownership | Every query filters by \`userId\`. Cross-account reads return 404, not 403, to avoid leaking existence. |
| Credential storage | AES-256-GCM with a per-record IV and auth tag; master key from \`ENCRYPTION_KEY\`. |
| Secret exposure | API responses never include keys or ciphertext; error messages are scrubbed of token-shaped strings. |
| Input validation | Zod schemas on every write endpoint; string length ceilings to control request size. |
| Path safety | \`assertSafePath\` blocks traversal, absolute paths, null bytes and \`.git\`. |
| Rate limiting | Login/register (10/min/IP), task steps (30/min/user). |
| Audit trail | \`task_events\`, \`tool_executions\`, \`approvals\` record who did what and when. |
| Headers | \`X-Content-Type-Options\`, \`X-Frame-Options\`, \`Referrer-Policy\`, \`Permissions-Policy\`. |
| CSRF | Mutations require JSON content type from same-origin fetch; cookies are SameSite=Lax. |
| Agent permissions | ASK/PLAN are hard-gated to read-only tools; write tools require approval in AGENT mode. |

## Multi-instance rate limiting

The limiter is in-memory per serverless instance. Under real load, move counters to PostgreSQL (a \`rate_limits\` table with an upsert) or your edge provider's limiter. This is documented rather than hidden: the in-memory limiter is a guard rail, not a hard quota.

## What you must do

1. Generate unique \`AUTH_SECRET\` and \`ENCRYPTION_KEY\` values. Never reuse the example values.
2. Use a pooled TLS connection string for PostgreSQL, and restrict network access to your provider's IP ranges where possible.
3. Keep provider keys scoped: use keys with minimum quota, and rotate them if a device is lost.
4. Review agent approvals. Approval is the last line of defence before a commit reaches your repository.
5. Back up your database before rotating \`ENCRYPTION_KEY\`.
6. Set \`APP_URL\` correctly; OAuth state validation depends on it.

## Threat model

- **Malicious repo content.** A repository can contain text engineered to steer the model. Tool output is bounded and truncated; write tools still require approval. Treat agent output as untrusted code, and review diffs before merging.
- **Prompt-injected tool use.** The model can only call tools in the registry; schemas and permission gates run *after* generation, so a manipulated model cannot reach unregistered capabilities.
- **Credential exfiltration.** Keys never enter prompts. Tool implementations receive a GitHub client, not a token string.
- **Cross-tenant access.** Enforced by filtering on the session user; there is no admin bypass endpoint.

## Reporting a vulnerability

See [SECURITY.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/SECURITY.md). Do not open a public issue for an unpatched vulnerability.`,
  },
  {
    slug: "api-reference", title: "API Reference",
    description: "Versioned REST endpoints, request shapes and response envelopes.",
    body: `# API Reference

Base path: \`/api/v1\`. All responses use an envelope:

\`\`\`json
{ "data": { … } }
\`\`\`

Errors:

\`\`\`json
{ "error": "human readable message" }
\`\`\`

Authentication is a cookie (\`fury_session\`), so browser clients need no headers. All endpoints below except register/login/health require a session.

## Auth

| Method | Path | Body |
| --- | --- | --- |
| POST | \`/auth/register\` | \`{ name, email, password }\` |
| POST | \`/auth/login\` | \`{ email, password }\` |
| POST | \`/auth/logout\` | — |
| GET | \`/me\` | — |
| DELETE | \`/me\` | — (delete account) |

## Projects

| Method | Path | Notes |
| --- | --- | --- |
| GET | \`/projects\` | List your projects |
| POST | \`/projects\` | \`{ name, description?, owner?, repo?, defaultBranch?, instructions? }\` |
| GET | \`/projects/{id}\` | Single project |
| DELETE | \`/projects/{id}\` | Deletes project; tasks keep history |

## Providers

| Method | Path | Notes |
| --- | --- | --- |
| GET | \`/providers\` | Never includes keys |
| POST | \`/providers\` | Full provider config |
| PATCH | \`/providers/{id}\` | Partial; \`apiKey\` optional |
| DELETE | \`/providers/{id}\` | — |
| POST | \`/providers/{id}/test\` | \`{ ok, message, models? }\` |

## Models

\`GET /models\` — optionally \`?providerId=\`. Returns discovered model IDs per provider.

## GitHub

| Method | Path | Notes |
| --- | --- | --- |
| GET | \`/github/repositories\` | \`{ connected, login?, repositories }\` |
| DELETE | \`/github/repositories\` | Disconnect |
| POST | \`/github/connect\` | \`{ url }\` + state cookie |
| GET | \`/github/callback\` | OAuth redirect target |
| POST | \`/github/import\` | \`{ repoId, owner, repo, defaultBranch }\` |
| GET | \`/github/files\` | \`?owner&repo&branch&path\` or \`&tree=1\` |
| PUT | \`/github/files\` | \`{ owner, repo, branch, path, content }\` |
| GET | \`/github/branches\` | \`?owner&repo\` |
| POST | \`/github/branches\` | \`{ owner, repo, branch, from }\` |

## Tasks

| Method | Path | Notes |
| --- | --- | --- |
| POST | \`/tasks\` | \`{ title, prompt, mode, projectId?, providerId? }\` |
| GET | \`/tasks\` | \`?status=&limit=\` |
| GET | \`/tasks/{id}\` | Task + messages |
| DELETE | \`/tasks/{id}\` | — |
| POST | \`/tasks/{id}/step\` | Advance one bounded step |
| POST | \`/tasks/{id}/stream\` | Text/plain token stream for ASK/PLAN replies (AGENT mode uses \`/step\`) |
| POST | \`/tasks/{id}/approve\` | \`{ approved: boolean }\` |
| POST | \`/tasks/{id}/cancel\` | — |
| POST | \`/tasks/{id}/resume\` | Continue after failure/cancel |
| GET | \`/tasks/{id}/messages\` | Conversation history |
| POST | \`/tasks/{id}/messages\` | \`{ content }\` follow-up instruction; reopens a finished task |
| GET | \`/tasks/{id}/events\` | Progress timeline |

## Streaming

\`POST /api/v1/tasks/{id}/stream\` returns \`text/plain\` chunks as the model produces them, then persists the
full assistant message, token usage and events before closing. Providers that ignore \`stream: true\` and answer
with JSON are handled transparently. AGENT-mode tasks cannot use this endpoint: tool calls must pass permission
checks and approval gates inside the bounded step endpoint.

## Usage & health

\`GET /usage\` — token totals by model. \`GET /health\` — configuration status (no secrets).

## Example: run a task

\`\`\`bash
# create
curl -X POST https://your-app/api/v1/tasks -b cookies.txt \\
  -H 'content-type: application/json' \\
  -d '{"title":"Add tests","prompt":"Add tests for the auth module","mode":"agent","projectId":"…"}'

# step until completed
curl -X POST https://your-app/api/v1/tasks/TASK_ID/step -b cookies.txt
\`\`\`

Statuses: \`pending\`, \`planning\`, \`running\`, \`waiting_approval\`, \`reviewing\`, \`completed\`, \`failed\`, \`cancelled\`.`,
  },
  {
    slug: "contributing", title: "Contributing",
    description: "Fork, branch, test and open a pull request.",
    body: `# Contributing

Thanks for helping. Fury Agent is MIT licensed and welcomes pull requests.

## Process

1. Fork and clone:
   \`\`\`bash
   git clone https://github.com/<you>/Fury-Agent.git
   cd Fury-Agent && npm install
   \`\`\`
2. Create a branch: \`git checkout -b feat/my-change\`.
3. Configure \`.env.local\` (see [Installation](/docs/installation)).
4. Make the change. Keep the diff focused; one concern per PR.
5. Run the checks:
   \`\`\`bash
   npm run typecheck
   npm test
   npm run build
   \`\`\`
6. Commit with a clear message (\`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`), push, and open a PR against \`main\`.

## What a good PR contains

- A description of the problem and the approach.
- Screenshots or a short clip for UI changes (mobile width included).
- Tests for new logic — validation, encryption, tool permissions and API authorization are the highest-value areas.
- Documentation updates when behaviour or configuration changes.

## Code conventions

- TypeScript strict; no \`any\` in new public APIs.
- Server-only code stays under \`src/server\` or \`src/lib\` and never imports from a client component.
- Never log secrets; never expose credentials in responses.
- Add new agent tools to \`src/server/tools/index.ts\` with a Zod schema, a permission level and a \`needsApproval\` flag.
- New provider adapters go in \`src/server/providers\` and must handle "capability not supported" honestly.

## Reporting bugs

Open an issue with: version/commit, environment (local or Vercel), reproduction steps, expected vs actual, and relevant logs **with secrets redacted**.

## Reporting vulnerabilities

Follow [SECURITY.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/SECURITY.md) — private disclosure, not a public issue.

## Code of Conduct

Participation is governed by [CODE_OF_CONDUCT.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/CODE_OF_CONDUCT.md).`,
  },
  {
    slug: "faq", title: "Troubleshooting & FAQ",
    description: "Common failures and their fixes.",
    body: `# Troubleshooting & FAQ

## "No enabled AI provider configured"

Add a provider in **Providers**, verify **Test** succeeds, and ensure *Enabled* is on. For AGENT mode also confirm tool calling is supported, otherwise the model can never request a tool.

## Provider test fails with HTTP 401/403

The key is wrong, expired, or scoped for a different endpoint. Confirm the base URL matches the provider (for example Groq uses \`/openai/v1\`, OpenRouter uses \`/api/v1\`). Re-enter the key — editing without a key keeps the stored one.

## Model discovery returns nothing

Some gateways do not implement \`GET /models\`. Type the model ID manually. Fury never guesses a model list.

## "ENCRYPTION_KEY is not configured"

Provider saving requires encryption. Set a 64-hex-char key and redeploy/restart. Keys cannot be stored in plaintext by design.

## GitHub connect redirects with \`state_mismatch\`

Cookies were blocked or the callback URL differs from the OAuth App setting. Ensure \`APP_URL\` matches the deployment and the callback is exactly \`{APP_URL}/api/v1/github/callback\`.

## "GitHub is not connected" in the editor

Open the editor from a project or the GitHub page after connecting. The editor needs \`owner\`, \`repo\` and \`branch\` query parameters.

## Task stuck in \`waiting_approval\`

A write tool needs your approval. Open the task and press **Approve** — or **Reject** to let the agent continue without it. Approvals are also listed on the Approvals page.

## Task fails with "Max steps reached"

The agent used its step budget (\`maxSteps\`, default 25). Split the request into smaller tasks. Raising the limit increases cost and risk, not reliability.

## Task says another invocation is processing it

The 5-minute lease from a previous request is still held. Wait for it to expire or press Resume; the lock is cleared when a request finishes normally.

## Why doesn't a reply stream in AGENT mode?

AGENT mode can request write tools, so every model turn must pass permission checks and possibly wait for your
approval. Those turns run through the bounded step endpoint. ASK and PLAN replies stream token-by-token from
\`POST /api/v1/tasks/{id}/stream\`.

## Are tests run?

No — unless your repository has GitHub Actions workflows, in which case Fury displays their status. Fury cannot execute repository code inside Vercel Functions, and it says so instead of inventing results.

## Can the agent run shell commands?

No. There is no shell. Editing happens through the GitHub API. The \`ExecutionProvider\` interface exists for adding an external runner later and is disabled by default.

## Is it free?

The software is MIT licensed and free to self-host. You pay for your Vercel usage, your database, and your AI provider. Fury Agent never charges a subscription and never proxies requests through the maintainer's keys.

## Does it work on mobile?

Yes. The dashboard has a bottom navigation bar, touch-sized controls, a responsive editor and no horizontal overflow at 360 px.

## How do I reset my password?

There is no email flow. Update \`password_hash\` in PostgreSQL with a bcrypt hash, or delete and re-register the account.`,
  },
];

export function getDoc(slug: string) {
  return DOCS.find((d) => d.slug === slug);
}

export function docHref(slug: string) {
  return slug ? `/docs/${slug}` : "/docs";
}
