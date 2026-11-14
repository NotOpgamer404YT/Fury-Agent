import { describe, it, expect, afterEach } from "vitest";
import { authSecret, resolveAuthSecret } from "@/lib/auth/session";
import { envStatus, envWarnings } from "@/lib/env-status";

const ORIGINAL = { ...process.env };


afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("authSecret", () => {
  it("uses AUTH_SECRET when configured", () => {
    process.env.AUTH_SECRET = "configured-secret-value";
    expect(new TextDecoder().decode(authSecret())).toBe("configured-secret-value");
    expect(resolveAuthSecret("configured-secret-value", "production")).toBe("configured-secret-value");
  });

  it("falls back to a development key outside production", () => {
    expect(resolveAuthSecret(undefined, "development")).toContain("dev-only");
    expect(resolveAuthSecret(undefined, "test")).toContain("dev-only");
  });

  it("fails closed in production instead of using the public dev key", () => {
    expect(() => resolveAuthSecret(undefined, "production")).toThrow(/AUTH_SECRET is not configured/);
  });
});

describe("envStatus / envWarnings", () => {
  it("reports configured services without leaking values", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost/db";
    process.env.AUTH_SECRET = "x";
    process.env.ENCRYPTION_KEY = "y";
    process.env.GITHUB_CLIENT_ID = "id";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    const status = envStatus();
    expect(status).toEqual({ database: true, authSecret: true, encryption: true, github: true });
    expect(JSON.stringify(status)).not.toContain("postgres://");
    expect(envWarnings(status)).toEqual([]);
  });

  it("lists the missing settings that break persistence", () => {
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
    delete process.env.ENCRYPTION_KEY;
    process.env.GITHUB_CLIENT_ID = "id";
    process.env.GITHUB_CLIENT_SECRET = "secret";
    const warnings = envWarnings(envStatus());
    expect(warnings.map((w) => w.key)).toEqual(["database", "authSecret", "encryption"]);
    // GitHub is optional by design, so it is never a blocking warning.
    expect(warnings.some((w) => w.key === "github")).toBe(false);
  });
});
