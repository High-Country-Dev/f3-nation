"use client";

import type { ReactNode } from "react";

import { orpc, useQuery } from "~/orpc/react";
import type { RouterOutputs } from "~/orpc/types";
import { REGIONS_DEFAULT_INPUT } from "./regions-table";

/**
 * Seeds the regions query's React Query cache with data the server already
 * fetched, so RegionsTable's own useQuery (same REGIONS_DEFAULT_INPUT, same
 * query key) reuses it instead of refetching on mount.
 */
export const RegionsHydrator = (params: {
  initialData: RouterOutputs["org"]["all"];
  children: ReactNode;
}) => {
  useQuery(
    orpc.org.all.queryOptions({
      input: REGIONS_DEFAULT_INPUT,
      initialData: params.initialData,
    }),
  );

  return <>{params.children}</>;
};
