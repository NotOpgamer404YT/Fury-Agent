import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => { process.env.ENCRYPTION_KEY = "a".repeat(64); });

describe("credential encryption", () => {
  it("round-trips plaintext", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const secret = "sk-test-1234567890";
    const enc = encrypt(secret);
    expect(enc).not.toContain(secret);
    expect(decrypt(enc)).toBe(secret);
  });
  it("produces unique ciphertext per call (random IV)", async () => {
    const { encrypt } = await import("@/lib/encryption");
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });
  it("fails on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const enc = encrypt("value");
    const tampered = enc.slice(0, -4) + "AAAA";
    expect(() => decrypt(tampered)).toThrow();
  });
  it("throws without ENCRYPTION_KEY", async () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    const { encrypt } = await import("@/lib/encryption");
    expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
    process.env.ENCRYPTION_KEY = saved;
  });
});
