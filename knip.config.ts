import { KnipConfig } from "knip";

const config: KnipConfig = {
  treatConfigHintsAsErrors: true,
  ignore: [
    ".venv/**",
    "apps/**/src/lib/logging.ts",
    "apps/auth/src/lib/auth.ts",
    "packages/**/src/logger.ts",
    "packages/db/src/**",
    "packages/shared/src/app/constants.ts",
    ".claude/scripts/sync-agent-skills.mjs",
    "tooling/typescript/type-extensions.d.ts",
    "turbo/generators/config.ts",
    // AI-SDLC factory tooling (fork-only). Its entry points are CI workflows
    // (e2e-triage / adversarial-review) invoking `tsx src/review-pr.ts` /
    // `triage-e2e-failure.ts`, so knip can't trace usage across the workflow
    // boundary and reports internal helpers as unused. It carries its own
    // vitest suite; follow-up to configure knip entries properly.
    "tooling/ci-factory/**",
  ],
  ignoreDependencies: [
    "@turbo/gen",
    "dayjs",
    "dotenv",
    "esbuild-register",
    "tsx",
    // Ambient Google Maps global types — referenced as `google.maps.*`
    // throughout the codebase, not imported explicitly.
    "@types/google.maps",
  ],
  ignoreBinaries: [
    "uv",
    // Postgres CLIs the obfuscator's verify harness shells out to.
    "initdb",
    "pg_ctl",
    "pg_isready",
    "createdb",
  ],
  workspaces: {
    "tooling/scripts": {
      entry: [
        "src/notify-outstanding-requests.ts",
        "src/script.ts",
        // Obfuscator + verify CLIs (F3-65 staging refresh), run via
        // package scripts, not imported.
        "src/obfuscate-db.ts",
        "src/obfuscate-db.verify.ts",
        "src/obfuscate-db.verify-target.ts",
      ],
    },
  },
};

export default config;
