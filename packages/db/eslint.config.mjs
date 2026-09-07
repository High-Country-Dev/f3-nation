import baseConfig from "@acme/eslint-config/base";
import drizzleConfig from "@acme/eslint-config/drizzle";

export default [
  // drizzle/.introspected is a scratch directory scribbled by `pnpm db:pull`
  // (see src/reconcile-schema.ts) — it's gitignored and not part of
  // tsconfig's `include`, so type-aware lint rules can't parse it.
  { ignores: ["eslint.config.mjs", "drizzle/.introspected/**"] },
  ...baseConfig,
  ...drizzleConfig,
];
