export const dynamic = "force-dynamic";

import { Suspense } from "react";

import Layout from "../admin-layout";
import { AddRegionButton } from "./[id]/add-region-button";
import { REGIONS_DEFAULT_INPUT } from "./regions-default-input";
import { RegionsHydrator } from "./regions-hydrator";
import { RegionsTable } from "./regions-table";

const RegionsPage = async () => {
  // In-process oRPC call (see ~/orpc/client.server.ts) using the real
  // signed-in session — prefetches exactly the data RegionsTable's own
  // useQuery will request on first render (REGIONS_DEFAULT_INPUT), so the
  // initial HTML has real rows instead of the Suspense fallback.
  const { client } = await import("~/orpc/client");
  const initialData = await client.org.all(REGIONS_DEFAULT_INPUT);

  return (
    <Layout title="Regions">
      <div className="flex w-full flex-col">
        <div className="flex flex-row items-center justify-between">
          <h1 className="hidden text-2xl font-bold lg:block">Regions</h1>
          <div className="ml-auto flex flex-row items-center justify-start gap-2">
            <AddRegionButton />
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <RegionsHydrator initialData={initialData}>
            <div className="flex w-full flex-col overflow-hidden">
              <RegionsTable />
            </div>
          </RegionsHydrator>
        </Suspense>
      </div>
    </Layout>
  );
};

export default RegionsPage;
