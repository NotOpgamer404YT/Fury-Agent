import { describe, it, expect } from "vitest";
import { getTool, toolDefinitionsForModel } from "@/server/tools";

describe("tool execution safety", () => {
  it("refuses repo tools without a GitHub connection", async () => {
    const tool = getTool("read_file")!;
    await expect(tool.execute({ owner: null, repo: null, branch: "main", github: null, mode: "ask" }, { path: "README.md" }))
      .rejects.toThrow(/No GitHub repository/i);
  });

  it("validates tool inputs via schema", () => {
    const tool = getTool("read_file")!;
    expect(tool.schema.safeParse({}).success).toBe(false);
    expect(tool.schema.safeParse({ path: "a.ts" }).success).toBe(true);
  });

  it("generates a patch without network access", async () => {
    const tool = getTool("generate_patch")!;
    const out: any = await tool.execute({ owner: null, repo: null, branch: "main", github: null, mode: "plan" }, {
      path: "a.ts", before: "const a = 1;", after: "const a = 2;",
    });
    expect(out.patch).toContain("-const a = 1;");
    expect(out.patch).toContain("+const a = 2;");
  });

  it("exports only allowed tools per mode", () => {
    const ask = toolDefinitionsForModel("ask").map((t) => t.function.name);
    expect(ask).toContain("read_file");
    expect(ask).not.toContain("create_commit");
    const agent = toolDefinitionsForModel("agent").map((t) => t.function.name);
    expect(agent).toContain("create_commit");
  });
});
