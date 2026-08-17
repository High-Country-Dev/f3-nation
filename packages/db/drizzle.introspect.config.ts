import type { Config } from "drizzle-kit";

import { getDbUrl } from "./src/utils/functions";

const { databaseUrl: url, databaseName } = getDbUrl();

// Used only by `pnpm db:pull` (via src/reconcile-schema.ts) to introspect
// into a throwaway directory instead of overwriting drizzle/schema.ts and
// drizzle/relations.ts directly — see src/reconcile-schema.ts for why.
export default {
  dialect: "postgresql",
  dbCredentials: { url },
  // drizzle-kit only introspects "public" by default, but the OAuth tables
  // (packages/db/drizzle/schema.ts's oauth*/emailMfaCodes) live in a
  // separate "auth" Postgres schema.
  schemaFilter: ["public", "auth"],
  migrations: {
    schema: "drizzle",
    table: `__drizzle_migrations_${databaseName}`,
  },
  out: "./drizzle/.introspected",
} satisfies Config;
