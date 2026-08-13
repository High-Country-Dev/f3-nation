/**
 * The regions table's default (first-render) query input, before any filter
 * or pagination interaction. Shared between the server prefetch
 * (page.tsx), the client table's initial state (regions-table.tsx), and the
 * hydrator (regions-hydrator.tsx) — kept in a plain module (no "use client")
 * so importing it from a server component doesn't turn it into an opaque
 * client-reference stub instead of the real object.
 */
export const REGIONS_DEFAULT_INPUT = {
  orgTypes: ["region"] as const,
  pageIndex: 0,
  pageSize: 10,
  statuses: ["active"] as const,
  onlyMine: true,
};
