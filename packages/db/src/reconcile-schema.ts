import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const INTROSPECTED_DIR = path.join(PACKAGE_ROOT, "drizzle/.introspected");
const SCHEMA_PATH = path.join(PACKAGE_ROOT, "drizzle/schema.ts");
const RELATIONS_PATH = path.join(PACKAGE_ROOT, "drizzle/relations.ts");

// `drizzle-kit pull` introspects the live DB and can't reproduce these
// hand-maintained parts of drizzle/schema.ts, so a bare pull silently
// destroys them (#628). This script introspects into a throwaway directory
// (drizzle.introspect.config.ts) and reapplies them before writing the real
// files, so `git diff` only ever shows genuine schema changes.
//
// Add an entry below whenever a new jsonb() "meta" column gets a
// `.$type<>()` annotation in drizzle/schema.ts.
const JSONB_TYPE_ANNOTATIONS: {
  table: string; // snake_case table name, as passed to pgTable(...)
  column: string; // camelCase column property name
  typeName: string; // type imported from @acme/shared/app/types
}[] = [
  { table: "slack_spaces", column: "settings", typeName: "SlackSpacesMeta" },
  { table: "slack_users", column: "meta", typeName: "SlackUserMeta" },
  { table: "attendance", column: "meta", typeName: "AttendanceMeta" },
  { table: "locations", column: "meta", typeName: "LocationMeta" },
  { table: "users", column: "meta", typeName: "UserMeta" },
  { table: "orgs", column: "meta", typeName: "OrgMeta" },
  { table: "events", column: "meta", typeName: "EventMeta" },
  { table: "update_requests", column: "eventMeta", typeName: "EventMeta" },
  {
    table: "update_requests",
    column: "meta",
    typeName: "UpdateRequestMeta",
  },
  {
    table: "achievements_x_users",
    column: "meta",
    typeName: "AchievementAwardMeta",
  },
];

// Add an entry below whenever a new Postgres enum gets wrapped around a
// shared `@acme/shared/app/enums` value in drizzle/schema.ts.
const ENUM_WRAPS: {
  pgSnakeName: string; // snake_case name, as passed to pgEnum(...)
  sharedName: string; // enum imported from @acme/shared/app/enums
}[] = [
  { pgSnakeName: "user_role", sharedName: "UserRole" },
  { pgSnakeName: "day_of_week", sharedName: "DayOfWeek" },
  { pgSnakeName: "event_cadence", sharedName: "EventCadence" },
  { pgSnakeName: "event_category", sharedName: "EventCategory" },
  { pgSnakeName: "series_exception", sharedName: "SeriesException" },
  { pgSnakeName: "org_type", sharedName: "OrgType" },
  { pgSnakeName: "region_role", sharedName: "RegionRole" },
  { pgSnakeName: "update_request_status", sharedName: "UpdateRequestStatus" },
  { pgSnakeName: "user_status", sharedName: "UserStatus" },
  { pgSnakeName: "request_type", sharedName: "RequestType" },
  { pgSnakeName: "achievement_cadence", sharedName: "AchievementCadence" },
];

// Postgres types with no drizzle-orm/pg-core builder (e.g. `citext`) are
// declared via `customType()`. Introspection can't know a column used one —
// it emits `unknown("col") // TODO: failed to parse database type '...'`
// instead, which doesn't even compile. Add an entry below whenever a new
// `customType()` is introduced in drizzle/schema.ts.
const CUSTOM_TYPES: {
  builderName: string; // the customType() const's exported name
  definitionSource: string; // its full `export const x = customType(...)` block
  usages: { table: string; column: string }[];
}[] = [
  {
    builderName: "citext",
    definitionSource: `export const citext = customType<{ data: string }>({
  fromDriver(value) {
    return value as string;
  },
  toDriver(value) {
    return value;
  },
  dataType() {
    return "citext";
  },
});
`,
    usages: [{ table: "users", column: "email" }],
  },
];

// drizzle-kit suffixes exported names for tables in a non-"public" Postgres
// schema with "In<SchemaName>" to avoid collisions — the hand-maintained
// files use cleaner names instead. Add entries below whenever a new table is
// added to a non-public schema. Order doesn't matter: these are
// whole-identifier (word-boundary) renames.
//
// The schema object itself (introspected as `export const auth =
// pgSchema("auth")`) is NOT in this list — renameAuthSchemaObject below
// handles it specifically, because a blind `\bauth\b` replace would also
// rewrite the "auth" *string literal* (the real Postgres schema name)
// passed to pgSchema(), pointing the generated code at a schema that
// doesn't exist.
const IDENTIFIER_RENAMES: { from: string; to: string }[] = [
  { from: "emailMfaCodesInAuth", to: "emailMfaCodes" },
  { from: "oauthClientsInAuth", to: "oauthClients" },
  { from: "oauthRefreshTokensInAuth", to: "oauthRefreshTokens" },
  { from: "oauthAccessTokensInAuth", to: "oauthAccessTokens" },
  { from: "oauthAuthorizationCodesInAuth", to: "oauthAuthorizationCodes" },
  // relations.ts derives "many"-side relation keys and relations() export
  // names from the table export name, so these need their own entries too.
  { from: "oauthRefreshTokensInAuths", to: "oauthRefreshTokens" },
  { from: "oauthAccessTokensInAuths", to: "oauthAccessTokens" },
  { from: "oauthAuthorizationCodesInAuths", to: "oauthAuthorizationCodes" },
  {
    from: "oauthRefreshTokensInAuthRelations",
    to: "oauthRefreshTokensRelations",
  },
  { from: "oauthClientsInAuthRelations", to: "oauthClientsRelations" },
  {
    from: "oauthAccessTokensInAuthRelations",
    to: "oauthAccessTokensRelations",
  },
  {
    from: "oauthAuthorizationCodesInAuthRelations",
    to: "oauthAuthorizationCodesRelations",
  },
];

function renameAuthSchemaObject(schema: string) {
  // Rename only the declaration's *identifier* — the string literal schema
  // name passed to pgSchema() must stay exactly "auth" to match the real
  // Postgres schema.
  const decl = "export const auth = pgSchema(";
  if (!schema.includes(decl)) {
    throw new Error(
      "reconcile-schema: could not find the introspected `export const auth = pgSchema(...)` declaration to rename to `authProviderSchema`. Update renameAuthSchemaObject in src/reconcile-schema.ts, or the auth schema was renamed/dropped upstream.",
    );
  }
  schema = schema.replace(decl, "export const authProviderSchema = pgSchema(");

  // Rename usages (`auth.table(...)`) — matches only a standalone `auth`
  // immediately followed by `.`, which never occurs inside the "auth"
  // string literal above (that's followed by `)`, not `.`).
  return schema.replace(/\bauth\./g, "authProviderSchema.");
}

function applyIdentifierRenames(schema: string, relations: string) {
  for (const { from, to } of IDENTIFIER_RENAMES) {
    const regex = new RegExp(`\\b${from}\\b`, "g");
    // `auth` (the schema object) is only declared in schema.ts; relations.ts
    // only references some table names, not all of them — so a rename only
    // needs to appear in at least one of the two files to be legitimate.
    if (!regex.test(schema) && !regex.test(relations)) {
      throw new Error(
        `reconcile-schema: could not find identifier "${from}" to rename to "${to}" in either file. Update IDENTIFIER_RENAMES in src/reconcile-schema.ts, or it was renamed/dropped upstream.`,
      );
    }
    schema = schema.replace(new RegExp(`\\b${from}\\b`, "g"), to);
    relations = relations.replace(new RegExp(`\\b${from}\\b`, "g"), to);
  }
  return { schema, relations };
}

function findTableBlock(source: string, tableName: string) {
  // pgTable("table_name" appears either inline (`pgTable("x", {`) or with
  // the second-arg object literal starting on its own line.
  const startRegex = new RegExp(
    `export const \\w+ = pgTable\\(\\s*"${tableName}"`,
  );
  const startMatch = startRegex.exec(source);
  if (!startMatch) {
    throw new Error(
      `reconcile-schema: could not find table "${tableName}" in the freshly introspected schema.ts — was it renamed or dropped? Update JSONB_TYPE_ANNOTATIONS in src/reconcile-schema.ts.`,
    );
  }
  const start = startMatch.index;
  const searchFrom = start + startMatch[0].length;
  // Bound the block by the next table declaration, whether it's a plain
  // pgTable(...) or a schema-qualified `someSchema.table(...)` (e.g. the
  // renamed `authProviderSchema.table(...)` after applyIdentifierRenames) —
  // otherwise a block could over-extend past an intervening schema-qualified
  // table and swallow a later table's same-named column.
  const nextTableMatch = /export const \w+ = (?:pgTable|\w+\.table)\(/.exec(
    source.slice(searchFrom),
  );
  const end = nextTableMatch
    ? searchFrom + nextTableMatch.index
    : source.length;
  return { start, end };
}

function applyJsonbAnnotations(source: string) {
  for (const { table, column, typeName } of JSONB_TYPE_ANNOTATIONS) {
    const { start, end } = findTableBlock(source, table);
    const block = source.slice(start, end);
    const columnRegex = new RegExp(
      `(^[ \\t]*${column}: jsonb\\([^)]*\\))(,?[ \\t]*$)`,
      "m",
    );
    if (!columnRegex.test(block)) {
      throw new Error(
        `reconcile-schema: could not find jsonb column "${column}" on table "${table}" in the freshly introspected schema.ts. Update JSONB_TYPE_ANNOTATIONS in src/reconcile-schema.ts, or the column was renamed/dropped upstream.`,
      );
    }
    const annotatedBlock = block.replace(
      columnRegex,
      `$1.$type<${typeName}>()$2`,
    );
    source = source.slice(0, start) + annotatedBlock + source.slice(end);
  }
  return source;
}

function applyEnumWraps(source: string) {
  for (const { pgSnakeName, sharedName } of ENUM_WRAPS) {
    const enumRegex = new RegExp(
      `pgEnum\\(\\s*"${pgSnakeName}"\\s*,\\s*\\[[^\\]]*\\]\\s*\\)`,
    );
    if (!enumRegex.test(source)) {
      throw new Error(
        `reconcile-schema: could not find enum "${pgSnakeName}" in the freshly introspected schema.ts. Update ENUM_WRAPS in src/reconcile-schema.ts, or the enum was renamed/dropped upstream.`,
      );
    }
    source = source.replace(
      enumRegex,
      `pgEnum("${pgSnakeName}", ${sharedName})`,
    );
  }
  return source;
}

function applyCustomTypes(source: string) {
  for (const { builderName, definitionSource, usages } of CUSTOM_TYPES) {
    for (const { table, column } of usages) {
      const { start, end } = findTableBlock(source, table);
      const block = source.slice(start, end);
      const columnRegex = new RegExp(
        // drizzle-kit prints a `// TODO: failed to parse database type '...'`
        // comment on its own line directly above the `unknown(...)` column it
        // couldn't resolve — drop it too, since we're resolving it right here.
        `^[ \\t]*// TODO: failed to parse database type '[^']*'\\n([ \\t]*${column}: )unknown\\(`,
        "m",
      );
      if (!columnRegex.test(block)) {
        throw new Error(
          `reconcile-schema: could not find "${column}: unknown(" (the introspected stand-in for customType "${builderName}") on table "${table}". Update CUSTOM_TYPES in src/reconcile-schema.ts, or the column was renamed/dropped upstream.`,
        );
      }
      const patchedBlock = block.replace(columnRegex, `$1${builderName}(`);
      source = source.slice(0, start) + patchedBlock + source.slice(end);
    }

    if (!source.includes(`export const ${builderName} = customType`)) {
      const firstTableMatch = /export const \w+ = pgTable\(/.exec(source);
      if (!firstTableMatch) {
        throw new Error(
          "reconcile-schema: could not find any pgTable(...) export to insert customType definitions before.",
        );
      }
      source =
        source.slice(0, firstTableMatch.index) +
        definitionSource +
        "\n" +
        source.slice(firstTableMatch.index);
    }
  }
  return source;
}

function sortPgCoreImportSpecifiers(source: string) {
  // drizzle-kit emits this import's specifiers in whatever order it
  // discovered the builders while introspecting, which churns from pull to
  // pull. Sorting them is the one piece of the "scrambled import order" this
  // script can actually fix deterministically (the repo's eslint config has
  // no import/order rule to lean on for this).
  const importRegex = /^import \{([^}]*)\} from "drizzle-orm\/pg-core";?$/m;
  const match = importRegex.exec(source);
  if (!match) {
    throw new Error(
      "reconcile-schema: could not find the drizzle-orm/pg-core import to sort its specifiers.",
    );
  }
  const specifiers = match
    .at(1)!
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
  return source.replace(
    importRegex,
    `import { ${specifiers.join(", ")} } from "drizzle-orm/pg-core";`,
  );
}

function addCustomTypeImport(source: string) {
  if (CUSTOM_TYPES.length === 0) return source;

  const importEnd = source.indexOf('from "drizzle-orm/pg-core"');
  if (importEnd === -1) {
    throw new Error(
      "reconcile-schema: expected the freshly introspected schema.ts to have a drizzle-orm/pg-core named import to add `customType` to.",
    );
  }
  const importStatement = source.slice(0, importEnd);
  if (/\bcustomType\b/.test(importStatement)) return source;

  const anchor = "import {";
  if (!source.startsWith(anchor)) {
    throw new Error(
      "reconcile-schema: expected the freshly introspected schema.ts to start with a drizzle-orm/pg-core named import to add `customType` to.",
    );
  }
  return anchor + " customType," + source.slice(anchor.length);
}

function prependSharedImports(source: string) {
  const enumNames = ENUM_WRAPS.map((e) => e.sharedName).sort();
  const typeNames = [
    ...new Set(JSONB_TYPE_ANNOTATIONS.map((a) => a.typeName)),
  ].sort();

  const importBlock =
    `import {\n${enumNames.map((n) => `  ${n},`).join("\n")}\n} from "@acme/shared/app/enums";\n` +
    `import type {\n${typeNames.map((n) => `  ${n},`).join("\n")}\n} from "@acme/shared/app/types";\n`;

  const anchor = 'from "drizzle-orm/pg-core"';
  const anchorIndex = source.indexOf(anchor);
  if (anchorIndex === -1) {
    throw new Error(
      "reconcile-schema: could not find the drizzle-orm/pg-core import in the freshly introspected schema.ts to anchor the shared imports after.",
    );
  }
  const lineEnd = source.indexOf("\n", anchorIndex + anchor.length) + 1;
  return source.slice(0, lineEnd) + "\n" + importBlock + source.slice(lineEnd);
}

function run(cmd: string, args: string[]) {
  execFileSync(cmd, args, {
    cwd: PACKAGE_ROOT,
    stdio: "inherit",
    // On this repo's supported dev platforms (macOS, WSL2, and CI, all
    // POSIX) `pnpm` is a plain executable, so args are passed literally with
    // no shell involved — no escaping concerns regardless of what
    // PACKAGE_ROOT contains. `shell: true` is only needed on native Windows,
    // where pnpm resolves to pnpm.cmd and Windows' CreateProcess won't apply
    // PATHEXT resolution without a shell — but per AGENTS.md, native Windows
    // isn't a supported dev shell in the first place.
    shell: process.platform === "win32",
  });
}

function main() {
  rmSync(INTROSPECTED_DIR, { recursive: true, force: true });

  console.log("Introspecting live database schema...");
  run("pnpm", [
    "exec",
    "drizzle-kit",
    "pull",
    "--config=drizzle.introspect.config.ts",
  ]);

  const introspectedSchemaPath = path.join(INTROSPECTED_DIR, "schema.ts");
  const introspectedRelationsPath = path.join(INTROSPECTED_DIR, "relations.ts");
  if (
    !existsSync(introspectedSchemaPath) ||
    !existsSync(introspectedRelationsPath)
  ) {
    throw new Error(
      `reconcile-schema: drizzle-kit pull did not produce the expected files under ${INTROSPECTED_DIR}`,
    );
  }

  console.log("Reapplying typed json annotations and shared imports...");
  let schema = readFileSync(introspectedSchemaPath, "utf8");
  let relations = readFileSync(introspectedRelationsPath, "utf8");
  schema = renameAuthSchemaObject(schema);
  ({ schema, relations } = applyIdentifierRenames(schema, relations));

  schema = applyJsonbAnnotations(schema);
  schema = applyEnumWraps(schema);
  schema = applyCustomTypes(schema);
  schema = addCustomTypeImport(schema);
  schema = sortPgCoreImportSpecifiers(schema);
  schema = prependSharedImports(schema);

  writeFileSync(SCHEMA_PATH, schema);
  writeFileSync(RELATIONS_PATH, relations);

  console.log("Formatting reconciled files...");
  run("pnpm", ["exec", "prettier", "--write", SCHEMA_PATH, RELATIONS_PATH]);
  run("pnpm", ["exec", "eslint", "--fix", SCHEMA_PATH, RELATIONS_PATH]);

  console.log(
    'Done. Review "git diff drizzle/schema.ts drizzle/relations.ts" — it should now show only genuine schema changes.',
  );
}

main();
