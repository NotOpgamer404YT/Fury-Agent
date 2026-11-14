# Configuration

All configuration is through environment variables. Only three are required.

## Required

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Neon/Supabase pooled URL recommended). |
| `AUTH_SECRET` | Signs session cookies (JWT HS256). Use 32 random bytes. Rotating it invalidates all sessions. |
| `ENCRYPTION_KEY` | AES-256-GCM master key for provider API keys and GitHub tokens. 64 hex chars, 32 base64 bytes, or a passphrase (SHA-256 derived). |

## Recommended

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public origin, e.g. `https://fury.example.com`. Used for OAuth redirect URIs. |

## Optional

| Variable | Purpose |
| --- | --- |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID. Enables the GitHub integration. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret. |
| `GITHUB_APP_ID` | Reserved for GitHub App installations (see [/docs/github](/docs/github)). |
| `GITHUB_PRIVATE_KEY` | Reserved for GitHub App private key (PEM, newline-escaped). |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Optional object storage for large artifacts. |

> Provider API keys are **not** application-wide variables. Each user stores their own keys through the Providers UI, encrypted with `ENCRYPTION_KEY`.

## Rotating secrets

1. **AUTH_SECRET** — set the new value, deploy. Existing sessions become invalid; users sign in again.
2. **ENCRYPTION_KEY** — rotation requires re-encryption, because stored ciphertext is bound to the old key. Procedure: keep the old key mounted as `ENCRYPTION_KEY_OLD`, add a small script that decrypts with the old key and re-encrypts with the new one, run it against `provider_configs.api_key_encrypted` and `github_connections.access_token_encrypted`, then remove the old key. Never rotate without a backup.

## Dependency security

Vercel blocks deploys that ship a known-vulnerable Next.js build, so treat upgrades as part of maintenance:

```bash
npm audit --omit=dev --audit-level=high   # production dependency gate (runs in CI)
npm audit                                 # full tree, including dev tooling
```

The project tracks the latest patched releases: **Next.js 16.4**, React 19.3, Drizzle ORM 0.45, Zod 4.
If your fork pins older versions, expect the Vercel security gate to reject the build — upgrade instead of
bypassing it.

Runtime dependencies currently report **no advisories** (`npm audit --omit=dev` → 0 vulnerabilities). The full
tree may still show a few **moderate, development-only** findings inside `drizzle-kit`'s legacy `@esbuild-kit`
loader, which never reaches a deployed function. They are tracked rather than hidden.

## Security rules

- Never prefix secrets with `NEXT_PUBLIC_`. Those values are compiled into client JavaScript.
- Never commit `.env` files. `.gitignore` already excludes `.env*`.
- Encrypted values are never returned by the API: provider responses expose only `hasApiKey: true/false`.
