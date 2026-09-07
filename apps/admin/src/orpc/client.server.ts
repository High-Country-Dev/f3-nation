import "server-only";

import { createRouterClient } from "@orpc/server";

import { router } from "@acme/api";
import { Client, Header } from "@acme/shared/common/enums";

import { getAccessToken } from "~/lib/auth/server";

/**
 * Server-side oRPC client for admin's server components.
 *
 * packages/api authenticates via the same SSO access-token bearer scheme
 * admin's own oRPC proxy (~/app/api/orpc/[[...rest]]/route.ts) already
 * uses for client-side calls — it isn't cookie-based, so forwarding the
 * incoming request's cookies/headers directly (like apps/map's SSG variant
 * does for its bearer-token-only case) wouldn't authenticate anything here.
 * Instead, read admin's own access-token cookie and present it exactly as
 * the proxy route does, just without the extra HTTP hop to apps/api.
 *
 * @see https://orpc.dev/docs/best-practices/optimize-ssr
 */
globalThis.$client = createRouterClient(router, {
  context: async () => {
    const accessToken = await getAccessToken();
    const reqHeaders = new Headers({ [Header.Client]: Client.ORPC });
    if (accessToken) {
      reqHeaders.set(Header.Authorization, `Bearer ${accessToken}`);
    }
    return { reqHeaders };
  },
});
