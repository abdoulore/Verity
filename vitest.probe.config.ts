import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest config for the AC-06 acceptance probe only.
 * Run with: npm run verity:probe
 * Excluded from the main test suite (vitest.config.ts includes only *.test.ts).
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.probe.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
