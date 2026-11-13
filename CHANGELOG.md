# Changelog

All notable changes to Fury Agent are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Streaming-style progress timeline, tool activity and markdown conversation history.

**GitHub**
- OAuth App flow with state validation, encrypted token storage, repo listing and import.
- Repository browsing, file read/write, tree listing, branch creation, multi-file commits via blob→tree→commit, compare and pull requests.
- CodeMirror 6 editor: multiple tabs, syntax highlighting, diff preview, font sizing, unsaved-change warnings, GitHub-backed commits.

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
