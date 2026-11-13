import { describe, it, expect } from "vitest";
import { buildAuthorizeUrl, GitHubClient } from "@/lib/github";

describe("github helpers", () => {
  it("builds an authorize URL with minimum scopes", () => {
    const url = buildAuthorizeUrl("cid", "https://app.example/cb", "state123");
    expect(url).toContain("client_id=cid");
    expect(url).toContain(encodeURIComponent("https://app.example/cb"));
    expect(url).toContain("state=state123");
    expect(url).toContain("scope=repo+read%3Auser");
  });

  it("creates a client without leaking the token", () => {
    const c = new GitHubClient("ghp_secrettoken");
    expect(JSON.stringify(Object.keys(c))).not.toContain("ghp_secrettoken");
    expect(typeof c.listRepos).toBe("function");
    expect(typeof c.commitFiles).toBe("function");
    expect(typeof c.createPullRequest).toBe("function");
  });
});
