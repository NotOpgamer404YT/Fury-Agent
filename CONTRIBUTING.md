# Contributing to Fury Agent

Thanks for taking the time to contribute. Fury Agent is MIT licensed and welcomes pull requests, issues and documentation fixes.

## Getting set up

```bash
git clone https://github.com/<you>/Fury-Agent.git
cd Fury-Agent
npm install
cp .env.example .env.local
```

Fill in `DATABASE_URL`, `AUTH_SECRET` and `ENCRYPTION_KEY`, then:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

Without `DATABASE_URL` the app runs on an in-memory store — handy for UI work, never for production.

## Workflow

1. **Fork** the repository and create a branch: `git checkout -b feat/short-description`.
2. **Change one thing.** Focused diffs get reviewed faster than mixed refactors.
3. **Verify locally:**
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
4. **Commit** using conventional-ish prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
5. **Push** to your fork and open a pull request against `main`.
6. Address review comments; keep the branch rebased where reasonable.

## What makes a good pull request

- A short problem statement and the approach you chose.
- Screenshots or a screen recording for UI changes — include a 360 px mobile width.
- Tests for new logic. Highest-value areas: validation, credential encryption, tool permission gating, API authorization, task state transitions.
- Documentation updates when behaviour, configuration or limitations change. "Honest limits" sections are part of the product.

## Code conventions

- TypeScript **strict**; avoid `any` in new exported APIs.
- Server-only modules live in `src/server/*` or `src/lib/*` and must never be imported by client components.
- Never log secrets. Never include credentials or ciphertext in API responses — use `publicProvider` in `src/lib/serializers.ts`.
- Validate every request body with Zod.
- Add agent tools to `src/server/tools/index.ts` with: description, Zod schema, `requires` level (`read` / `write` / `git`), `needsApproval` and safe path handling through `assertSafePath`.
- New provider adapters go in `src/server/providers/` and must degrade honestly when a capability (tools, streaming, discovery) is unsupported.
- Database changes: edit `src/lib/database/schema.ts`, run `npm run db:generate`, commit the generated SQL in `drizzle/`.

## Areas that need help

- PostgreSQL-backed rate limiting for multi-instance deployments.
- More provider adapters and tool-calling normalisation.
- Playwright end-to-end coverage of the agent approval flow.
- Documentation translations.

## Reporting bugs

Open an issue with: commit/version, environment (local or Vercel), reproduction steps, expected vs actual, and logs **with secrets redacted**.

## Reporting vulnerabilities

Read [SECURITY.md](SECURITY.md) — private disclosure, never a public issue.

## Code of Conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
