import { describe, it, expect, beforeAll } from "vitest";
import { registerUser, loginUser, hashPassword, verifyPassword } from "@/lib/auth";
import { store } from "@/lib/store";

beforeAll(() => { delete process.env.DATABASE_URL; });

describe("auth (dev memory store)", () => {
  it("hashes passwords with bcrypt and verifies", async () => {
    const h = await hashPassword("supersecret");
    expect(h.startsWith("$2")).toBe(true);
    expect(await verifyPassword("supersecret", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });

  it("registers and logs in a user", async () => {
    const u = await registerUser("Test User", "test@example.com", "password123");
    expect(u.email).toBe("test@example.com");
    expect(store.users.get(u.id)?.passwordHash).not.toContain("password123");
    const logged = await loginUser("test@example.com", "password123");
    expect(logged.id).toBe(u.id);
  });

  it("rejects duplicate email", async () => {
    await expect(registerUser("Dup", "test@example.com", "password123")).rejects.toThrow(/already/);
  });

  it("rejects a wrong password", async () => {
    await expect(loginUser("test@example.com", "nope")).rejects.toThrow(/Invalid/);
  });

  it("rejects unknown users", async () => {
    await expect(loginUser("ghost@example.com", "x")).rejects.toThrow(/Invalid/);
  });
});
