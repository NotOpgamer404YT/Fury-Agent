# Security

## Controls implemented

| Area | Control |
| --- | --- |
| Passwords | bcrypt, cost 12. Never logged, never returned. |
| Sessions | HS256 JWT in an httpOnly, SameSite=Lax cookie (7 days) carrying a `sid`; the `sessions` row is authoritative, so logout revokes immediately and expired rows are rejected. |
| Route protection | `src/proxy.ts` (Next.js 16 Proxy, formerly middleware) redirects unauthenticated page requests; every private handler calls `requireUser()`. |
| Ownership | Every query filters by `userId`. Cross-account reads return 404, not 403, to avoid leaking existence. |
| Credential storage | AES-256-GCM with a per-record IV and auth tag; master key from `ENCRYPTION_KEY`. |
| Secret exposure | API responses never include keys or ciphertext; error messages are scrubbed of token-shaped strings. |
| Input validation | Zod schemas on every write endpoint; string length ceilings to control request size. |
| Path safety | `assertSafePath` blocks traversal, absolute paths, null bytes and `.git`. |
| Rate limiting | Login/register (10/min/IP), task steps (30/min/user). |
| Audit trail | `task_events`, `tool_executions`, `approvals` record who did what and when. |
| Headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. |
| CSRF | Mutations require JSON content type from same-origin fetch; cookies are SameSite=Lax. |
| Agent permissions | ASK/PLAN are hard-gated to read-only tools; write tools require approval in AGENT mode. |

## Multi-instance rate limiting

The limiter is in-memory per serverless instance. Under real load, move counters to PostgreSQL (a `rate_limits` table with an upsert) or your edge provider's limiter. This is documented rather than hidden: the in-memory limiter is a guard rail, not a hard quota.

## What you must do

1. Generate unique `AUTH_SECRET` and `ENCRYPTION_KEY` values. Never reuse the example values.
2. Use a pooled TLS connection string for PostgreSQL, and restrict network access to your provider's IP ranges where possible.
3. Keep provider keys scoped: use keys with minimum quota, and rotate them if a device is lost.
4. Review agent approvals. Approval is the last line of defence before a commit reaches your repository.
5. Back up your database before rotating `ENCRYPTION_KEY`.
6. Set `APP_URL` correctly; OAuth state validation depends on it.

## Threat model

- **Malicious repo content.** A repository can contain text engineered to steer the model. Tool output is bounded and truncated; write tools still require approval. Treat agent output as untrusted code, and review diffs before merging.
- **Prompt-injected tool use.** The model can only call tools in the registry; schemas and permission gates run *after* generation, so a manipulated model cannot reach unregistered capabilities.
- **Credential exfiltration.** Keys never enter prompts. Tool implementations receive a GitHub client, not a token string.
- **Cross-tenant access.** Enforced by filtering on the session user; there is no admin bypass endpoint.

## Reporting a vulnerability

See [SECURITY.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/SECURITY.md). Do not open a public issue for an unpatched vulnerability.
