import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { USERS_DEFAULT_INPUT } from "~/app/users/users-default-input";
import { UsersHydrator } from "~/app/users/users-hydrator";
import type { RouterOutputs } from "~/orpc/types";

const useQueryMock = vi.fn();

vi.mock("~/orpc/react", () => ({
  useQuery: (options: unknown) => {
    useQueryMock(options);
    return undefined;
  },
  orpc: {
    user: {
      all: {
        queryOptions: (options: { input: unknown; initialData: unknown }) => ({
          queryKey: ["user.all"],
          input: options.input,
          initialData: options.initialData,
        }),
      },
    },
  },
}));

const initialData = {
  users: [],
} as unknown as RouterOutputs["user"]["all"];

describe("UsersHydrator", () => {
  it("seeds the user.all query with the server-fetched data and the shared default input", () => {
    render(
      <UsersHydrator initialData={initialData}>
        <div>user content</div>
      </UsersHydrator>,
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: USERS_DEFAULT_INPUT,
        initialData,
      }),
    );
  });

  it("renders its children", () => {
    render(
      <UsersHydrator initialData={initialData}>
        <div>user content</div>
      </UsersHydrator>,
    );

    expect(screen.getByText("user content")).toBeTruthy();
  });
});
