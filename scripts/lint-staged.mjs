#!/usr/bin/env node
// Runs `eslint --fix` over staged files, one process per eslint.config.js.
// ESLint 10 resolves config from each file's directory, so a single root
// invocation loads one type-aware TypeScript Program per workspace at once and
// exhausts the heap. Batching keeps peak memory at one workspace's worth.

import { existsSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const CONFIG_NAMES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
];

function nearestConfigDir(file) {
  let dir = dirname(resolve(ROOT, file));
  while (dir.startsWith(ROOT)) {
    if (CONFIG_NAMES.some((name) => existsSync(join(dir, name)))) return dir;
    if (dir === ROOT) break;
    dir = dirname(dir);
  }
  return ROOT;
}

function eslintEntry(dir) {
  // Invoke eslint's actual JS entrypoint via `node` rather than the pnpm
  // .bin shim: the shim is an extensionless POSIX script on Unix but a
  // .CMD/.ps1 wrapper on Windows, and spawning it portably would require
  // `shell: true`, which Node deprecates for array args (DEP0190) because
  // they're concatenated into the shell command line unescaped.
  const local = join(dir, "node_modules", "eslint", "bin", "eslint.js");
  return existsSync(local)
    ? local
    : join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
}

const files = process.argv.slice(2).filter((file) => existsSync(file));
if (!files.length) process.exit(0);

const buckets = new Map();
for (const file of files) {
  const dir = nearestConfigDir(file);
  if (!buckets.has(dir)) buckets.set(dir, []);
  buckets.get(dir).push(relative(dir, resolve(ROOT, file)));
}

const failed = [];
for (const [dir, bucketFiles] of buckets) {
  const label = relative(ROOT, dir) || ".";
  const cache = join(
    ROOT,
    "node_modules/.cache/lint-staged",
    `${label.split(sep).join("-")}.eslintcache`,
  );
  const { status } = spawnSync(
    process.execPath,
    [
      eslintEntry(dir),
      "--fix",
      "--no-warn-ignored",
      "--cache",
      "--cache-location",
      cache,
      ...bucketFiles,
    ],
    { cwd: dir, stdio: "inherit" },
  );
  if (status !== 0) failed.push(label);
}

if (failed.length) {
  console.error(`\neslint failed in: ${failed.join(", ")}\n`);
  process.exit(1);
}
