import { beforeAll } from "vitest";

import { req, target } from "./transport";

/**
 * globalSetup runs in a separate process from each test file's own worker,
 * so it cannot pre-warm the module registry a file actually dispatches
 * through. Vitest isolates each characterization file into a fresh registry
 * (fileParallelism: false serializes files against the shared DB, but does
 * not disable per-file isolation), so whichever file runs first pays for
 * lazily loading the full route/router graph on its very first real request
 * — in CI this has taken long enough to lose a race inside the request
 * itself, producing a spurious auth failure instead of a slow pass. Firing
 * a throwaway request through the same in-process dispatch before any
 * assertions run forces that lazy loading to finish during setup instead.
 */
beforeAll(async () => {
  try {
    await target.invoke(req("/v1/ping"));
  } catch {
    // Only the warm-up side effect matters; a failed response here doesn't
    // indicate anything the real tests don't already assert on directly.
  }
});
