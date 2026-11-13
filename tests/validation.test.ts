import { describe, it, expect } from "vitest";
import { assertSafePath, providerSchema, registerSchema, taskSchema } from "@/lib/validation";
import { TOOLS, getTool, isToolAllowed } from "@/server/tools";

describe("assertSafePath", () => {
  it("accepts normal repo paths", () => {
    expect(assertSafePath("src/app/page.tsx")).toBe("src/app/page.tsx");
    expect(assertSafePath("/src/index.ts")).toBe("src/index.ts");
  });
  it("rejects traversal", () => {
    expect(() => assertSafePath("../secrets")).toThrow(/traversal/i);
    expect(() => assertSafePath("src/../../etc/passwd")).toThrow();
  });
  it("rejects .git and null bytes", () => {
    expect(() => assertSafePath(".git/config")).toThrow();
    expect(() => assertSafePath("a\0b")).toThrow();
  });
});

describe("schemas", () => {
  it("validates registration", () => {
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.com", password: "12345678" }).success).toBe(true);
    expect(registerSchema.safeParse({ name: "", email: "bad", password: "short" }).success).toBe(false);
  });
  it("rejects invalid provider base URLs", () => {
    const base = { name: "x", modelId: "m" };
    expect(providerSchema.safeParse({ ...base, baseUrl: "not-a-url" }).success).toBe(false);
    expect(providerSchema.safeParse({ ...base, baseUrl: "https://api.groq.com/openai/v1" }).success).toBe(true);
  });
  it("defaults task mode", () => {
    const r = taskSchema.parse({ title: "t", prompt: "p" });
    expect(r.mode).toBe("ask");
  });
});

describe("tool registry", () => {
  it("registers the required tools", () => {
    for (const name of ["list_files", "read_file", "search_files", "create_file", "edit_file", "delete_file", "generate_patch", "inspect_package_json", "inspect_requirements", "git_status", "git_diff", "create_branch", "create_commit", "create_pull_request"]) {
      expect(getTool(name), name).toBeDefined();
    }
  });
  it("enforces read-only modes", () => {
    const create = getTool("create_file")!;
    expect(isToolAllowed(create, "ask")).toBe(false);
    expect(isToolAllowed(create, "plan")).toBe(false);
    expect(isToolAllowed(create, "agent")).toBe(true);
    expect(isToolAllowed(getTool("read_file")!, "ask")).toBe(true);
  });
  it("marks write tools as requiring approval", () => {
    expect(getTool("create_commit")!.needsApproval).toBe(true);
    expect(getTool("read_file")!.needsApproval).toBe(false);
  });
  it("every tool has a schema", () => {
    for (const t of TOOLS) expect(t.schema).toBeDefined();
  });
});
