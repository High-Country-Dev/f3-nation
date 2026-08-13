import "server-only";

import { headers } from "next/headers";

import { createRouterClient } from "@orpc/server";

import { router } from "@acme/api";

/**
 * Server-side oRPC client for admin's server components.
 *
 * Unlike apps/map's SSG variant, admin pages are already `force-dynamic`
 * (the root layout calls `headers()`), so there's no static-generation
 * benefit to preserve here. We forward the real request headers instead of
 * a synthetic API-key header, so the existing cookie-based auth middleware
 * (`getSession` in packages/api/src/shared.ts) authenticates the in-process
 * call exactly as it would a normal HTTP request from this same browser.
 *
 * @see https://orpc.dev/docs/best-practices/optimize-ssr
 */
globalThis.$client = createRouterClient(router, {
  context: async () => ({ reqHeaders: await headers() }),
});
