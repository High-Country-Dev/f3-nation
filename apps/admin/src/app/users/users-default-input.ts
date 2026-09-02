import type { UserRole, UserStatus } from "@acme/shared/app/enums";

/**
 * The users table's default (first-render) query input, before any filter
 * or pagination interaction. Shared between the server prefetch
 * (page.tsx), the client table's initial state (user-table.tsx), and the
 * hydrator (users-hydrator.tsx) — kept in a plain module (no "use client")
 * so importing it from a server component doesn't turn it into an opaque
 * client-reference stub instead of the real object.
 */
export const USERS_DEFAULT_INPUT = {
  roles: ["admin", "editor"] as UserRole[],
  statuses: ["active"] as UserStatus[],
  searchTerm: "",
  pageSize: 20,
  pageIndex: 0,
  orgIds: [] as number[],
};
