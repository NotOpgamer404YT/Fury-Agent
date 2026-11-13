# Troubleshooting & FAQ

## "No enabled AI provider configured"

Add a provider in **Providers**, verify **Test** succeeds, and ensure *Enabled* is on. For AGENT mode also confirm tool calling is supported, otherwise the model can never request a tool.

## Provider test fails with HTTP 401/403

The key is wrong, expired, or scoped for a different endpoint. Confirm the base URL matches the provider (for example Groq uses `/openai/v1`, OpenRouter uses `/api/v1`). Re-enter the key — editing without a key keeps the stored one.

## Model discovery returns nothing

Some gateways do not implement `GET /models`. Type the model ID manually. Fury never guesses a model list.

## "ENCRYPTION_KEY is not configured"

Provider saving requires encryption. Set a 64-hex-char key and redeploy/restart. Keys cannot be stored in plaintext by design.

## GitHub connect redirects with `state_mismatch`

Cookies were blocked or the callback URL differs from the OAuth App setting. Ensure `APP_URL` matches the deployment and the callback is exactly `{APP_URL}/api/v1/github/callback`.

## "GitHub is not connected" in the editor

Open the editor from a project or the GitHub page after connecting. The editor needs `owner`, `repo` and `branch` query parameters.

## Task stuck in `waiting_approval`

A write tool needs your approval. Open the task and press **Approve** — or **Reject** to let the agent continue without it. Approvals are also listed on the Approvals page.

## Task fails with "Max steps reached"

The agent used its step budget (`maxSteps`, default 25). Split the request into smaller tasks. Raising the limit increases cost and risk, not reliability.

## Task says another invocation is processing it

The 5-minute lease from a previous request is still held. Wait for it to expire or press Resume; the lock is cleared when a request finishes normally.

## Are tests run?

No — unless your repository has GitHub Actions workflows, in which case Fury displays their status. Fury cannot execute repository code inside Vercel Functions, and it says so instead of inventing results.

## Can the agent run shell commands?

No. There is no shell. Editing happens through the GitHub API. The `ExecutionProvider` interface exists for adding an external runner later and is disabled by default.

## Is it free?

The software is MIT licensed and free to self-host. You pay for your Vercel usage, your database, and your AI provider. Fury Agent never charges a subscription and never proxies requests through the maintainer's keys.

## Does it work on mobile?

Yes. The dashboard has a bottom navigation bar, touch-sized controls, a responsive editor and no horizontal overflow at 360 px.

## How do I reset my password?

There is no email flow. Update `password_hash` in PostgreSQL with a bcrypt hash, or delete and re-register the account.
