/**
 * Public AI surface for the app. Server-only modules live in `src/server/providers`;
 * this barrel re-exports the pieces that both server routes and shared types need,
 * so adapter details stay in one place.
 */
export {
  PROVIDER_PRESETS,
  pickProvider,
  testProvider,
  fetchModels,
  chatCompletion,
  streamChat,
} from "@/server/providers";

export type { ProviderConfig, ChatMessage, ChatResult } from "@/server/providers";
