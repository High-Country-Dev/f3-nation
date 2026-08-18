import { coverageExclude, coverageInclude } from "@acme/vitest-config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "node",
    env: { NODE_ENV: "test" },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: coverageInclude,
      // server.ts and instrument.ts are hand-verified process bootstrap (Sentry
      // init, @hono/node-server serve(), SIGTERM handling) — same category as
      // the instrumentation.ts they replace, which bootstrapCoverageExclude
      // already excludes for every app.
      exclude: [...coverageExclude, "src/server.ts", "src/instrument.ts"],
      thresholds: {
        autoUpdate: true,
        statements: 91.04,
        branches: 93.47,
        functions: 80,
        lines: 91.04,
      },
    },
    exclude: [
      "characterization/**", // Runs under vitest.characterization.config.ts
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
