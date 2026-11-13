/** Shapes rows for API responses. NEVER includes secrets/ciphertext. */
export function publicProvider(p: any) {
  return {
    id: p.id, name: p.name, providerType: p.providerType, baseUrl: p.baseUrl, modelId: p.modelId,
    contextWindow: p.contextWindow, maxOutputTokens: p.maxOutputTokens, supportsTools: p.supportsTools,
    supportsStreaming: p.supportsStreaming, temperature: p.temperature, timeoutMs: p.timeoutMs,
    priority: p.priority, enabled: p.enabled, isDefault: p.isDefault, isCoding: p.isCoding,
    isPlanning: p.isPlanning, isReview: p.isReview, hasApiKey: Boolean(p.apiKeyEncrypted),
    lastTestedAt: p.lastTestedAt ?? null, lastTestStatus: p.lastTestStatus ?? null,
  };
}
