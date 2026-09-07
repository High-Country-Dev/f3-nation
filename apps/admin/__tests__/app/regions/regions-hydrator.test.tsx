import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REGIONS_DEFAULT_INPUT } from "~/app/regions/regions-default-input";
import { RegionsHydrator } from "~/app/regions/regions-hydrator";
import type { RouterOutputs } from "~/orpc/types";

const useQueryMock = vi.fn();

vi.mock("~/orpc/react", () => ({
  useQuery: (options: unknown) => {
    useQueryMock(options);
    return undefined;
  },
  orpc: {
    org: {
      all: {
        queryOptions: (options: { input: unknown; initialData: unknown }) => ({
          queryKey: ["org.all"],
          input: options.input,
          initialData: options.initialData,
        }),
      },
    },
  },
}));

const initialData = {
  orgs: [],
} as unknown as RouterOutputs["org"]["all"];

describe("RegionsHydrator", () => {
  it("seeds the org.all query with the server-fetched data and the shared default input", () => {
    render(
      <RegionsHydrator initialData={initialData}>
        <div>region content</div>
      </RegionsHydrator>,
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: REGIONS_DEFAULT_INPUT,
        initialData,
      }),
    );
  });

  it("renders its children", () => {
    render(
      <RegionsHydrator initialData={initialData}>
        <div>region content</div>
      </RegionsHydrator>,
    );

    expect(screen.getByText("region content")).toBeTruthy();
  });
});
