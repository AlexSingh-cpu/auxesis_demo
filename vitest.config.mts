import { defineConfig } from "vitest/config";

/** Logic tests only — no DOM, no browser. Component tests are a later phase. */
export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
