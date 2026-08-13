export const dynamic = "force-dynamic";

import { Suspense } from "react";

import Layout from "../admin-layout";
import { AddUserButton } from "./[id]/add-user-button";
import { USERS_DEFAULT_INPUT, UserTable } from "./user-table";
import { UsersHydrator } from "./users-hydrator";

const UsersPage = async () => {
  // In-process oRPC call (see ~/orpc/client.server.ts) using the real
  // signed-in session — prefetches exactly the data UserTable's own
  // useQuery will request on first render (USERS_DEFAULT_INPUT), so the
  // initial HTML has real rows instead of the Suspense fallback.
  const { client } = await import("~/orpc/client");
  const initialData = await client.user.all(USERS_DEFAULT_INPUT);

  return (
    <Layout title="Users">
      <div className="flex w-full flex-col">
        <div className="flex flex-row items-center justify-between">
          <h1 className="hidden text-2xl font-bold lg:block">Users</h1>
          <div className="ml-auto flex flex-row items-center justify-start gap-2">
            <AddUserButton />
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <UsersHydrator initialData={initialData}>
            <div className="flex w-full flex-col overflow-hidden">
              <UserTable />
            </div>
          </UsersHydrator>
        </Suspense>
      </div>
    </Layout>
  );
};

export default UsersPage;
