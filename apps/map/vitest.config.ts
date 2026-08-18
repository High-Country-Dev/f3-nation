import { coverageExclude, coverageInclude } from "@acme/vitest-config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: "jsdom",
    env: { NODE_ENV: "test" },
    setupFiles: ["__tests__/setup.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: coverageInclude,
      exclude: coverageExclude,
      thresholds: {
        autoUpdate: true,
        // A small margin below the locally-measured values above guards against
        // Windows (local) vs Linux (CI) v8 coverage instrumentation producing
        // slightly different percentages for identical code — see PR #86 CI failure.
        statements: 19.1,
        branches: 16.3,
        functions: 13.3,
        lines: 19.6,
      },
    },
    exclude: [
      "**/tests/**/*.spec.ts", // Exclude Playwright tests
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    server: {
      deps: {
        inline: ["vitest-canvas-mock", "jest-canvas-mock"],
      },
    },
    alias: {
      // Mock server-only modules in test environment
      "server-only": new URL(
        "./__tests__/mocks/server-only.ts",
        import.meta.url,
      ).pathname,
      // Mock oRPC server client to avoid database initialization
      "~/orpc/client.server": new URL(
        "./__tests__/mocks/orpc-client-server.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
