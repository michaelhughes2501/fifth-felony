import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.mjs"],
    exclude: ["defunct_apps/**", "node_modules/**", ".next/**"],
  },
});
