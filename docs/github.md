# GitHub Setup

Fury Agent uses **GitHub OAuth** with the minimum practical scopes: `repo` and `read:user`.

## 1. Create an OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: your `APP_URL`.
3. Authorization callback URL: `{APP_URL}/api/v1/github/callback`.
4. Copy the **Client ID** and generate a **Client Secret**.

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
APP_URL=https://your-instance.vercel.app
```

## 2. Connect in the UI

Go to **GitHub → Connect GitHub**. The flow:

1. `POST /api/v1/github/connect` returns the authorize URL and sets an httpOnly `state` cookie.
2. GitHub redirects to `/api/v1/github/callback`.
3. The callback verifies `state`, exchanges the code for a token, reads `/user`, and stores the token **encrypted** in `github_connections`.

## 3. Import a repository

**GitHub → Import** creates a `projects` row plus a `repositories` row. The project carries owner, repo and default branch, which every agent tool uses.

## Scopes and permissions

| Scope | Why |
| --- | --- |
| `repo` | Read private repositories, create branches, commit, open PRs. |
| `read:user` | Display the connected GitHub login. |

Tokens are decrypted **server-side only**, never returned through an API, and never placed in a model prompt. The agent sees tool *results*, not credentials.

## Write safety

- All mutating tools are marked `needsApproval`. In AGENT mode a task pauses at `waiting_approval` and only continues when you approve in the UI.
- `assertSafePath` blocks `..`, absolute paths, null bytes and `.git/` access on every filesystem-shaped tool.
- Nothing is force-pushed. Commits are appended to a task branch; PRs are opened from that branch.
- Never commit directly to a protected branch without explicit approval — the default flow creates a branch first via `create_branch`.

## GitHub App (optional, future)

`GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY` are reserved for installation tokens (finer-grained, per-repository permissions). The OAuth App path is fully implemented; the App path is documented as the supported next step for organisations that require installation-scoped access. Do not set these variables expecting behaviour that does not exist yet.

## Workflow status

Fury can list Actions workflows and runs for a repository. If no workflow exists, the UI reports **tests were not executed** — it never fabricates a green check.
