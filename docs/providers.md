# AI Providers

Every user brings their own keys. Nothing is shared with the Fury Agent maintainers, and no endpoint is privileged.

## Adding a provider

1. Go to **Providers → Add provider**.
2. Pick a preset (it fills the base URL) or choose *Custom*.
3. Paste your API key and the model ID.
4. Describe the endpoint honestly:
   - **Tool calling** — enable only if the provider returns OpenAI-style `tool_calls`. Without it, AGENT mode degrades to text-only planning.
   - **Streaming** — enable if `stream: true` is supported; otherwise Fury falls back to non-streaming completions.
5. Set priority (lower wins) and optionally mark it as default / coding / planning / review.

## Presets

| Provider | Base URL | Notes |
| --- | --- | --- |
| FreeLLMAPI | `https://api.freellmapi.com/v1` | Aggregator; verify the current base URL in their docs. |
| OmniRoute | `https://api.omniroute.ai/v1` | Aggregator; verify the current base URL. |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | Native `generateContent` adapter, `?key=` auth. |
| Groq | `https://api.groq.com/openai/v1` | OpenAI-compatible, fast inference. |
| Cerebras | `https://api.cerebras.ai/v1` | OpenAI-compatible. |
| OpenRouter | `https://openrouter.ai/api/v1` | OpenAI-compatible, many models. |
| Custom | your URL | Any OpenAI-compatible `/chat/completions`. |

> **No free tier is guaranteed.** Aggregators change quotas, models and base URLs without notice. Fury never advertises "free forever" access — test the connection and check the provider's own terms.

## Testing and model discovery

**Test** performs a `GET /models` (or Gemini's `/models`) call and reports status. **Fetch models** lists what the endpoint advertises. If discovery is unsupported, type the model ID manually — this is expected for some gateways.

## Adapters

- `openai-compatible` family: `POST {baseUrl}/chat/completions`, `Authorization: Bearer`.
- `gemini`: `POST {baseUrl}/models/{model}:generateContent?key=...` with `systemInstruction` + `contents`.

Both normalise to `{ content, promptTokens, completionTokens, toolCalls? }`.

## Security

- Keys are encrypted with AES-256-GCM before insert.
- API responses expose `hasApiKey` only — never the key, never the ciphertext.
- Keys are never logged, never embedded in client bundles, and never sent to the model.
- Deleting a provider nulls the reference on historical tasks; usage rows are retained without credentials.

## Request behaviour

- Per-provider timeout (`timeoutMs`, default 60 s) via `AbortController`.
- Temperature is stored as text to preserve decimals exactly.
- Token usage is recorded per call in `model_usage`, aggregated on the dashboard.
