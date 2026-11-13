# Contributing

Thanks for helping. Fury Agent is MIT licensed and welcomes pull requests.

## Process

1. Fork and clone:
   ```bash
   git clone https://github.com/<you>/Fury-Agent.git
   cd Fury-Agent && npm install
   ```
2. Create a branch: `git checkout -b feat/my-change`.
3. Configure `.env.local` (see [Installation](/docs/installation)).
4. Make the change. Keep the diff focused; one concern per PR.
5. Run the checks:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
6. Commit with a clear message (`feat:`, `fix:`, `docs:`, `refactor:`), push, and open a PR against `main`.

## What a good PR contains

- A description of the problem and the approach.
- Screenshots or a short clip for UI changes (mobile width included).
- Tests for new logic — validation, encryption, tool permissions and API authorization are the highest-value areas.
- Documentation updates when behaviour or configuration changes.

## Code conventions

- TypeScript strict; no `any` in new public APIs.
- Server-only code stays under `src/server` or `src/lib` and never imports from a client component.
- Never log secrets; never expose credentials in responses.
- Add new agent tools to `src/server/tools/index.ts` with a Zod schema, a permission level and a `needsApproval` flag.
- New provider adapters go in `src/server/providers` and must handle "capability not supported" honestly.

## Reporting bugs

Open an issue with: version/commit, environment (local or Vercel), reproduction steps, expected vs actual, and relevant logs **with secrets redacted**.

## Reporting vulnerabilities

Follow [SECURITY.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/SECURITY.md) — private disclosure, not a public issue.

## Code of Conduct

Participation is governed by [CODE_OF_CONDUCT.md](https://github.com/NotOpgamer404YT/Fury-Agent/blob/main/CODE_OF_CONDUCT.md).
