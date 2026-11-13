# Fury Agent

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

1. A **Next.js App Router** application serves the marketing site, docs, dashboard and a versioned REST API (`/api/v1/*`).
2. **PostgreSQL + Drizzle ORM** persist users, sessions, projects, provider configs, tasks, task events, messages, tool executions, approvals and usage.
3. **Server-side provider adapters** talk to Gemini (native API) and any OpenAI-compatible endpoint (Groq, Cerebras, OpenRouter, FreeLLMAPI, OmniRoute, custom).
4. The **agent engine** is a persistent state machine. Each invocation performs **one bounded step**, writes a checkpoint, and returns. The browser polls the step endpoint until the task reaches a terminal state.
5. **Repository tools** operate over the GitHub REST and Git Database APIs. There is no shell, no Docker and no persistent process.

## Honest limitations

Fury Agent refuses to pretend. These are documented, by design:

- **No shell execution.** Vercel Functions do not provide a persistent Linux shell, so the agent cannot run build or test commands directly. A future `ExecutionProvider` interface exists (disabled by default) for wiring an external execution service.
- **Tests are not run.** If your repository has GitHub Actions workflows, Fury Agent can display their status. If no workflow exists it reports that tests were not executed.
- **Serverless stepping.** Long tasks are not background jobs. A task advances when the client calls `/step`; progress is checkpointed so you can resume after a reload, a timeout, or a failure.

## Next steps

- [Installation](/docs/installation) — run it locally in five minutes
- [Configuration](/docs/configuration) — environment variables explained
- [Providers](/docs/providers) — connect your own AI keys
- [Deployment](/docs/deployment) — ship to Vercel
