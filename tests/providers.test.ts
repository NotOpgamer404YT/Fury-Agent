import { describe, it, expect } from "vitest";
import { pickProvider, PROVIDER_PRESETS, type ProviderConfig } from "@/server/providers";

function p(over: Partial<ProviderConfig>): ProviderConfig {
  return {
    id: over.id ?? "1", userId: "u", name: over.name ?? "p", providerType: "groq",
    baseUrl: "https://api.groq.com/openai/v1", apiKeyEncrypted: null, modelId: "m",
    contextWindow: 128000, maxOutputTokens: 4096, supportsTools: true, supportsStreaming: true,
    temperature: "0.2", timeoutMs: 30000, priority: 50, enabled: true,
    isDefault: false, isCoding: false, isPlanning: false, isReview: false, ...over,
  };
}

describe("provider selection", () => {
  it("respects explicit provider id", () => {
    const a = p({ id: "a", priority: 10, isDefault: true });
    const b = p({ id: "b", priority: 90 });
    expect(pickProvider([a, b], "default", "b")?.id).toBe("b");
  });
  it("prefers role flags", () => {
    const a = p({ id: "a", priority: 10, isDefault: true });
    const b = p({ id: "b", priority: 90, isCoding: true });
    expect(pickProvider([a, b], "coding")?.id).toBe("b");
  });
  it("falls back to lowest priority among enabled", () => {
    const a = p({ id: "a", priority: 80 });
    const b = p({ id: "b", priority: 20 });
    expect(pickProvider([a, b], "coding")?.id).toBe("b");
  });
  it("ignores disabled providers", () => {
    const a = p({ id: "a", priority: 1, enabled: false });
    const b = p({ id: "b", priority: 50 });
    expect(pickProvider([a, b], "default")?.id).toBe("b");
  });
  it("returns null when nothing is enabled", () => {
    expect(pickProvider([p({ enabled: false })], "default")).toBeNull();
  });
  it("ships every preset with a label", () => {
    for (const key of ["openai-compatible", "gemini", "groq", "cerebras", "openrouter", "freellmapi", "omniroute", "custom"]) {
      expect(PROVIDER_PRESETS[key]?.label).toBeTruthy();
    }
  });
});
