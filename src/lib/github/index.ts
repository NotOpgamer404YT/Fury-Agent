/**
 * GitHub REST + Git Database API client.
 * Tokens are decrypted server-side only and NEVER sent to the model.
 */
import { decrypt } from "@/lib/encryption";

const API = "https://api.github.com";

export class GitHubClient {
  constructor(private token: string) {}
  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`GitHub HTTP ${res.status}: ${t.slice(0, 400)}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async me() { return this.req<{ id: number; login: string }>("/user"); }
  async listRepos(page = 1) {
    return this.req<any[]>(`/user/repos?per_page=100&page=${page}&sort=updated`);
  }
  async getRepo(owner: string, repo: string) {
    return this.req<any>(`/repos/${owner}/${repo}`);
  }
  async listBranches(owner: string, repo: string) {
    return this.req<any[]>(`/repos/${owner}/${repo}/branches?per_page=100`);
  }
  async listTree(owner: string, repo: string, branch: string, recursive = true) {
    return this.req<{ tree: any[]; truncated: boolean }>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=${recursive ? 1 : 0}`);
  }
  async getFile(owner: string, repo: string, path: string, ref?: string) {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return this.req<any>(`/repos/${owner}/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}${q}`);
  }
  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
    const f = await this.getFile(owner, repo, path, ref);
    if (f.type !== "file") throw new Error("Not a file");
    return Buffer.from(f.content, "base64").toString("utf8");
  }
  async searchCode(owner: string, repo: string, query: string) {
    const q = encodeURIComponent(`${query} repo:${owner}/${repo}`);
    return this.req<any>(`/search/code?q=${q}&per_page=30`);
  }
  async createBranch(owner: string, repo: string, branch: string, from = "main") {
    const ref = await this.req<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(from)}`);
    return this.req(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }),
    });
  }
  async getCommitSha(owner: string, repo: string, branch: string) {
    const ref = await this.req<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    return ref.object.sha;
  }
  /** Multi-file commit via blob → tree → commit → ref update. */
  async commitFiles(owner: string, repo: string, branch: string, files: Array<{ path: string; content: string }>, message: string) {
    const baseSha = await this.getCommitSha(owner, repo, branch);
    const baseCommit = await this.req<{ tree: { sha: string } }>(`/repos/${owner}/${repo}/git/commits/${baseSha}`);
    const treeEntries: any[] = [];
    for (const f of files) {
      const blob = await this.req<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
        method: "POST", body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
      });
      treeEntries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    }
    const tree = await this.req<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
      method: "POST", body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: treeEntries }),
    });
    const commit = await this.req<{ sha: string }>(`/repos/${owner}/${repo}/git/commits`, {
      method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
    });
    await this.req(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: "PATCH", body: JSON.stringify({ sha: commit.sha }),
    });
    return commit.sha;
  }
  async createPullRequest(owner: string, repo: string, title: string, body: string, head: string, base: string) {
    return this.req<any>(`/repos/${owner}/${repo}/pulls`, {
      method: "POST", body: JSON.stringify({ title, body, head, base }),
    });
  }
  async compare(owner: string, repo: string, base: string, head: string) {
    return this.req<any>(`/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
  }
  async listWorkflows(owner: string, repo: string) {
    return this.req<any>(`/repos/${owner}/${repo}/actions/workflows`);
  }
  async listWorkflowRuns(owner: string, repo: string) {
    return this.req<any>(`/repos/${owner}/${repo}/actions/runs?per_page=10`);
  }
}

export function githubClientFromEncrypted(encryptedToken: string): GitHubClient {
  return new GitHubClient(decrypt(encryptedToken));
}

export function buildAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, scope: "repo read:user", state });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error(j.error_description ?? "GitHub OAuth exchange failed");
  return j.access_token;
}
