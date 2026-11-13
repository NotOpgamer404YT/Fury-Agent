# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | ✅ |

## Reporting a vulnerability

**Do not open a public issue.** Report privately via GitHub's
[Security Advisories](https://github.com/NotOpgamer404YT/Fury-Agent/security/advisories/new)
or email the maintainers listed on the repository profile.

Include:

- affected version or commit;
- a description of the issue and its impact;
- reproduction steps or a proof of concept;
- any suggested mitigation.

You can expect an acknowledgement within 72 hours and a status update within 7 days.
Please allow time for a fix before public disclosure.

## Scope

In scope:

- authentication and session handling bypass;
- cross-account data access (IDOR) in `/api/v1/*`;
- credential exposure (provider keys, GitHub tokens) in responses, logs or client bundles;
- path traversal or write escalation in agent tools;
- approval bypass that commits to a repository without user consent;
- injection leading to server-side secret disclosure.

Out of scope:

- issues requiring a compromised deployment environment or database;
- denial of service from self-inflicted abuse of your own instance;
- rate limiting limitations already documented in `docs/security.md` (in-memory per instance);
- the absence of shell/test execution — this is a documented architectural limitation, not a vulnerability.

## Operator responsibilities

Self-hosted operators must:

1. generate unique `AUTH_SECRET` and `ENCRYPTION_KEY` values;
2. use a TLS PostgreSQL connection and restrict network access;
3. keep dependencies updated (`npm audit`);
4. review agent approvals before merging agent-authored commits;
5. back up the database before rotating the encryption key.

## Secure defaults already in place

- bcrypt password hashing (cost 12);
- httpOnly, SameSite=Lax session cookies with 7-day expiry and DB-backed session rows;
- AES-256-GCM encryption for stored credentials, per-record IV and auth tag;
- API responses expose `hasApiKey` only;
- Zod validation and length ceilings on every write endpoint;
- ownership filters on every per-user query;
- `assertSafePath` rejects traversal, absolute paths, null bytes and `.git`;
- write tools require explicit approval in AGENT mode before touching a repository;
- security headers set in `next.config.ts`.
