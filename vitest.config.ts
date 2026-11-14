import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Node for server logic; component tests opt into jsdom with
    // `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: true,
    setupFiles: ["tests/setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
