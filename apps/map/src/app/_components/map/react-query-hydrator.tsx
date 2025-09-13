"use client";

import type { ReactNode } from "react";

import type { RouterOutputs } from "@acme/api";

import { orpc, useQuery } from "~/orpc/react";

/**
 * Hydrates the map event and location data on the client that were generated
 * with ssg.
 */
export const ReactQueryHydrator = (params: {
  mapEventAndLocationData: RouterOutputs["location"]["getMapEventAndLocationData"];
  regionsWithLocationData: RouterOutputs["location"]["getRegionsWithLocation"];
  children: ReactNode;
}) => {
  console.log("ReactQueryHydrator rerender", params.mapEventAndLocationData);
  useQuery(
    orpc.location.getMapEventAndLocationData.queryOptions({
      input: undefined,
      // hydrate via initialData to keep same behavior
      initialData: params.mapEventAndLocationData,
    }),
  );
  useQuery(
    orpc.location.getRegionsWithLocation.queryOptions({
      input: undefined,
      initialData: params.regionsWithLocationData,
    }),
  );

  return <>{params.children}</>;
};
