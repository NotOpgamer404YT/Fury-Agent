# Architecture

## Layers

```
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
```

## The agent loop

The specification calls for a 12-step loop. Fury Agent implements it as **bounded, resumable steps**:

1. Receive task (row in `tasks`, status `pending`).
2. Load project context (project row, instructions, branch).
3. Retrieve relevant repository files (tool calls, not full clones).
4. Generate an execution plan (PLAN/AGENT mode: model composes a plan; events are recorded).
5. Select an AI model (`default`/`coding`/`planning`/`review` role, priority ordering).
6. Request tool calls from the model.
7. Validate tool permissions (mode gating + Zod schema + path safety).
8. Execute the tool through the GitHub API.
9. Return results to the model as `tool` messages.
10. Continue: the next `/step` call resumes from the checkpoint.
11. Review: status moves to `reviewing`.
12. Save results: messages, events, tool executions, usage, task state.

Each call performs **one** model round-trip plus any tool calls it requested, then persists everything. Nothing depends on the function staying alive.

## Statuses

`pending → planning → running → waiting_approval → running → reviewing → completed`, with `failed` and `cancelled` reachable from most states and `resume` available afterwards.

## Sessions

The session cookie is an HS256 JWT carrying the user id and a session id (`sid`). The database row is
authoritative: `getSessionUser` verifies the JWT, then loads the session row and rejects it if it is missing
or expired. Logout and account deletion delete the row, so sessions are genuinely revocable rather than
"valid until the token expires".

## Retries

`stepWithRetry` retries transport-shaped failures (timeouts, DNS/connection errors, HTTP 429/5xx) a bounded
number of times, clearing the terminal status between attempts. Business outcomes — approval pauses, invalid
tool arguments, permission denials — are never retried. The attempt count is returned with each step result.

## Concurrency control

`tasks.locked_at` acts as a lease. A step refuses to start if another invocation holds a lock younger than five minutes. This prevents duplicate execution from overlapping polls.

## Provider fallback

Providers carry a `priority` and role flags. Selection order: explicit task provider → role flag (`isCoding`/`isPlanning`/`isReview`/`isDefault`) → lowest priority among enabled providers. Failed calls surface as task errors; configure a second provider with a higher priority number to act as a fallback.

## Why no shell

Arbitrary code execution in a multi-tenant serverless environment is a security and product risk. Fury Agent edits repositories through the GitHub API instead — auditable, reviewable, and reversible. The `ExecutionProvider` interface in `src/server/tools/index.ts` defines the seam for adding an external execution service later; it ships empty and disabled.
