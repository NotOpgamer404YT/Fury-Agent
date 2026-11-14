# Changelog

All notable changes to Fury Agent are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] — 2026-11-13

### Security

- **Production fails closed without `AUTH_SECRET`.** The development signing key is
  public (it is in this repository), so a deployment without `AUTH_SECRET` used to
  be able to sign cookies with a known secret. In production, sign-in now returns
  an explicit configuration error instead.
- `GET /api/v1/health` continues to report configuration as booleans only.

### Added

- **Setup banner** in the dashboard shell: a persistent, server-rendered warning
  whenever `DATABASE_URL`, `AUTH_SECRET` or `ENCRYPTION_KEY` is missing, linking to
  the matching docs page. It disappears as soon as the value is set.
- `src/lib/env-status.ts` with unit tests (5).

### Changed

- CI and the migration-drift workflow run on Node 22, matching `engines.node` and
  the Vercel runtime; `jsdom@31` requires `^22.22.2`.

## [1.0.1] — 2026-11-13

### Security

- **Upgraded to Next.js 16.4.6** (from 15.1.6) and React 19.3.1, clearing the critical advisories that made
  Vercel reject the previous deployment ("Vulnerable version of Next.js detected" / CVE-2025-66478 and the
  related cache-poisoning, SSRF, middleware-bypass and image-optimizer issues).
- **Drizzle ORM 0.45.4** — fixes the SQL-injection advisory affecting escaped identifiers.
- **Zod 4.6.7** — fixes a memory-exhaustion advisory in constrained collections; validation schemas migrated
  to the v4 API (`z.email()`, `z.url()`, `error.issues`).
- **Vitest 5.1 / Vite 8** for dev tooling (clears the critical `tinypool`/`vitest` advisories).
- CI now fails on new high-severity **production** advisories: `npm audit --omit=dev --audit-level=high`.
- `engines.node` pinned to `22.x` so Vercel uses a supported, predictable runtime.

### Fixed

- **Agent: first step omitted the user prompt.** History was loaded before the prompt was persisted, so the
  model received only the system message on the opening turn. The prompt is now included in the same step and
  persisted, with a regression test that asserts the outgoing request carries it.
- **Dev/preview sessions vanished between requests.** The no-database fallback store is now a `globalThis`
  singleton, so route handlers and server components in the same process share users, sessions and tasks.
- Tool contracts are now declared as **explicit JSON schemas** instead of being derived from Zod internals,
  which had silently degraded every property to `string` after the Zod major upgrade.
- Dashboard layout is explicitly `force-dynamic` (per-user data must never be prerendered or cached), and
  `getSessionUser` no longer swallows unexpected errors as if the user were logged out.

### Changed

- `src/middleware.ts` → `src/proxy.ts` for the Next.js 16 Proxy convention.
- `vercel.json` keeps only framework/build settings; per-route `maxDuration` exports are canonical.
- `npm run lint` removed (`next lint` was dropped in Next 16); `npm run typecheck` is the static gate.
- Playwright and React Testing Library suites documented as opt-in; component tests run in jsdom.

## [1.0.0] — 2026-11-13

### Added

**Platform**
- Next.js 15 App Router application with TypeScript strict mode, Tailwind CSS and a dark-first design system (`#080B14` / `#8B5CF6` / `#06B6D4`).
- Public landing page with product preview, features, getting-started steps and a Vercel deploy link.
- Responsive dashboard shell: desktop sidebar, mobile bottom navigation, sticky top bar.
- Documentation portal at `/docs` with 11 pages, search, sidebar navigation, copy-code buttons, table of contents and previous/next navigation.

**Authentication**
- Registration, login, logout and account deletion.
- bcrypt password hashing (cost 12), HS256 JWT session cookie backed by a `sessions` table, 7-day expiry.
- Route protection via middleware plus `requireUser()` in every private handler.

**AI providers**
- Provider manager with add, edit, delete, enable/disable, priority, role assignment (default/coding/planning/review).
- Adapters for Google Gemini (native `generateContent`) and any OpenAI-compatible endpoint, with presets for FreeLLMAPI, OmniRoute, Groq, Cerebras and OpenRouter.
- Connection testing and optional model discovery; per-provider timeout, temperature, context window and max output tokens.
- AES-256-GCM encryption of API keys; responses expose `hasApiKey` only.

**Agent**
- ASK / PLAN / AGENT modes with hard-gated read-only tools for ASK and PLAN.
- Persistent task state machine: `pending → planning → running → waiting_approval → reviewing → completed | failed | cancelled`.
- Bounded one-step-per-request execution with `locked_at` lease protection, checkpointed state, resume, cancel and retry.
- 14-tool registry (`list_files`, `read_file`, `search_files`, `create_file`, `edit_file`, `delete_file`, `generate_patch`, `inspect_package_json`, `inspect_requirements`, `git_status`, `git_diff`, `create_branch`, `create_commit`, `create_pull_request`) with Zod schemas, permission levels and audit rows.
- Approval workflow for write tools, with an Approvals page.
- Token streaming for ASK/PLAN replies (`POST /api/v1/tasks/{id}/stream`) with persisted messages and usage; progress timeline, tool activity and markdown history in the task view.
- Follow-up instructions on a task (`POST /api/v1/tasks/{id}/messages`) that reopen finished conversations.
- Bounded retry for transient provider failures, surfaced as explicit retry events.

**GitHub**
- OAuth App flow with state validation, encrypted token storage, repo listing and import.
- Repository browsing, file read/write, tree listing, branch creation, multi-file commits via blob→tree→commit, compare and pull requests.
- CodeMirror 6 editor: multiple tabs, syntax highlighting, search and replace (Mod-F), bracket matching, auto-indentation, diff preview, font sizing, unsaved-change warnings, GitHub-backed commits.

**Data**
- Drizzle ORM schema with 14 tables (users, sessions, projects, github_connections, repositories, provider_configs, tasks, task_events, agent_messages, tool_executions, approvals, project_memories, model_usage, artifacts), foreign keys, indexes and timestamps.
- Generated SQL migration in `drizzle/`; `db:generate` / `db:migrate` scripts.
- Token usage tracking and dashboard aggregation.

**Security & quality**
- Zod validation, per-user ownership filters, rate limiting, safe path checks, scrubbed error messages, security headers.
- Vitest suite covering auth, encryption, provider selection, tool permissions, path safety, schemas and GitHub helpers.
- GitHub Actions CI (typecheck, tests, build) and CodeQL analysis.
- MIT license; README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, `.env.example`, `vercel.json`.

### Known limitations
- No shell execution or in-process test running (serverless constraint); `ExecutionProvider` interface provided, disabled by default.
- Rate limiting is in-memory per instance.
- GitHub App installation tokens are reserved but not yet implemented; OAuth App flow is supported.
