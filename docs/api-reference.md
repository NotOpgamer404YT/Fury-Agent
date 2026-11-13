# API Reference

Base path: `/api/v1`. All responses use an envelope:

```json
{ "data": { … } }
```

Errors:

```json
{ "error": "human readable message" }
```

Authentication is a cookie (`fury_session`), so browser clients need no headers. All endpoints below except register/login/health require a session.

## Auth

| Method | Path | Body |
| --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/logout` | — |
| GET | `/me` | — |
| DELETE | `/me` | — (delete account) |

## Projects

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/projects` | List your projects |
| POST | `/projects` | `{ name, description?, owner?, repo?, defaultBranch?, instructions? }` |
| GET | `/projects/{id}` | Single project |
| DELETE | `/projects/{id}` | Deletes project; tasks keep history |

## Providers

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/providers` | Never includes keys |
| POST | `/providers` | Full provider config |
| PATCH | `/providers/{id}` | Partial; `apiKey` optional |
| DELETE | `/providers/{id}` | — |
| POST | `/providers/{id}/test` | `{ ok, message, models? }` |

## Models

`GET /models` — optionally `?providerId=`. Returns discovered model IDs per provider.

## GitHub

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/github/repositories` | `{ connected, login?, repositories }` |
| DELETE | `/github/repositories` | Disconnect |
| POST | `/github/connect` | `{ url }` + state cookie |
| GET | `/github/callback` | OAuth redirect target |
| POST | `/github/import` | `{ repoId, owner, repo, defaultBranch }` |
| GET | `/github/files` | `?owner&repo&branch&path` or `&tree=1` |
| PUT | `/github/files` | `{ owner, repo, branch, path, content }` |
| GET | `/github/branches` | `?owner&repo` |
| POST | `/github/branches` | `{ owner, repo, branch, from }` |

## Tasks

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/tasks` | `{ title, prompt, mode, projectId?, providerId? }` |
| GET | `/tasks` | `?status=&limit=` |
| GET | `/tasks/{id}` | Task + messages |
| DELETE | `/tasks/{id}` | — |
| POST | `/tasks/{id}/step` | Advance one bounded step |
| POST | `/tasks/{id}/stream` | Text/plain token stream for ASK/PLAN replies (AGENT mode uses `/step`) |
| POST | `/tasks/{id}/approve` | `{ approved: boolean }` |
| POST | `/tasks/{id}/cancel` | — |
| POST | `/tasks/{id}/resume` | Continue after failure/cancel |
| GET | `/tasks/{id}/messages` | Conversation history |
| POST | `/tasks/{id}/messages` | `{ content }` follow-up instruction; reopens a finished task |
| GET | `/tasks/{id}/events` | Progress timeline |

## Streaming

`POST /api/v1/tasks/{id}/stream` returns `text/plain` chunks as the model produces them, then persists the
full assistant message, token usage and events before closing. Providers that ignore `stream: true` and answer
with JSON are handled transparently. AGENT-mode tasks cannot use this endpoint: tool calls must pass permission
checks and approval gates inside the bounded step endpoint.

## Usage & health

`GET /usage` — token totals by model. `GET /health` — configuration status (no secrets).

## Example: run a task

```bash
# create
curl -X POST https://your-app/api/v1/tasks -b cookies.txt \
  -H 'content-type: application/json' \
  -d '{"title":"Add tests","prompt":"Add tests for the auth module","mode":"agent","projectId":"…"}'

# step until completed
curl -X POST https://your-app/api/v1/tasks/TASK_ID/step -b cookies.txt
```

Statuses: `pending`, `planning`, `running`, `waiting_approval`, `reviewing`, `completed`, `failed`, `cancelled`.
