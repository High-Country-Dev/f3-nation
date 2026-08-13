"use client";

import type { ReactNode } from "react";

import { orpc, useQuery } from "~/orpc/react";
import type { RouterOutputs } from "~/orpc/types";
import { USERS_DEFAULT_INPUT } from "./users-default-input";

/**
 * Seeds the users query's React Query cache with data the server already
 * fetched, so UserTable's own useQuery (same USERS_DEFAULT_INPUT, same
 * query key) reuses it instead of refetching on mount.
 */
export const UsersHydrator = (params: {
  initialData: RouterOutputs["user"]["all"];
  children: ReactNode;
}) => {
  useQuery(
    orpc.user.all.queryOptions({
      input: USERS_DEFAULT_INPUT,
      initialData: params.initialData,
    }),
  );

  return <>{params.children}</>;
};
