import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests are opt-in:
 *   npx playwright install --with-deps
 *   npx playwright test
 *
 * They run against a locally built app with the in-memory store (no DATABASE_URL),
 * so no database is needed for the smoke flows.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000", trace: "on-first-retry" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://127.0.0.1:3000/api/v1/health",
        reuseExistingServer: true,
        timeout: 180_000,
        env: {
          AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret",
          ENCRYPTION_KEY: "0".repeat(64),
        },
      },
});
